from rest_framework import viewsets, status, views, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model
from .models import Question, ConstitutionType, ConstitutionAnalysis, Acupoint, Meridian
from .serializers import QuestionSerializer, ConstitutionResultSerializer, AcupointSerializer, MeridianSerializer
from .rag_service import analyze_drug_contraindication
import datetime

User = get_user_model()

class DrugAnalysisViewSet(viewsets.ViewSet):
    """
    药物禁忌分析接口
    """
    @action(detail=False, methods=['post'])
    def analyze(self, request):
        # 验证用户登录（可选，如果需要记录历史则必须）
        # user = request.user
        
        drug_name = request.data.get('drug_name')
        constitution = request.data.get('constitution')
        
        if not drug_name or not constitution:
            return Response({'error': '请提供药物名称和体质类型'}, status=status.HTTP_400_BAD_REQUEST)
            
        print(f"Request analysis for: {drug_name} + {constitution}")
        result = analyze_drug_contraindication(drug_name, constitution)
        
        return Response({
            'drug_name': drug_name,
            'constitution': constitution,
            'analysis_result': result
        })

class AuthViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['post'], url_path='send-code')
    def send_code(self, request):
        phone = request.data.get('phone')
        if not phone:
            return Response({'error': 'Phone number required'}, status=status.HTTP_400_BAD_REQUEST)
        # Mock sending code
        return Response({'message': 'Code sent (Dev: 8888)'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def login(self, request):
        phone = request.data.get('phone')
        code = request.data.get('code')
        
        if not phone or not code:
            return Response({'error': 'Phone and code required'}, status=status.HTTP_400_BAD_REQUEST)
            
        if code != '8888':
            return Response({'error': 'Invalid code'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Get or create user
        # Assuming username is phone for simplicity
        user, created = User.objects.get_or_create(username=phone, defaults={'phone': phone})
        if created and not user.phone:
            user.phone = phone
            user.save()
            
        token, _ = Token.objects.get_or_create(user=user)
        
        # Check if first login (or if has constitution result)
        has_result = ConstitutionAnalysis.objects.filter(user=user).exists()
        
        return Response({
            'token': token.key,
            'user_id': user.id,
            'phone': user.phone,
            'constitution': user.constitution,
            'is_first_login': not has_result # Treat as first login if no result
        })

class ConstitutionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Question.objects.all().order_by('constitution_type__id', 'order')
    serializer_class = QuestionSerializer
    
    @action(detail=False, methods=['post'])
    def submit(self, request):
        # Input: { answers: { question_id: score, ... }, gender: 'M'/'F' }
        answers = request.data.get('answers')
        gender = request.data.get('gender', 'N') # M or F
        
        if not answers:
            return Response({'error': 'Answers required'}, status=status.HTTP_400_BAD_REQUEST)
            
        user = request.user
        if not user.is_authenticated:
             return Response({'error': 'Auth required'}, status=status.HTTP_401_UNAUTHORIZED)

        # Initialize scores dict
        types = ConstitutionType.objects.all()
        type_map = {t.id: t.code for t in types}
        code_to_name = {t.code: t.name for t in types}
        scores = {t.code: {'raw': 0} for t in types}
            
        for q_id, score in answers.items():
            try:
                q = Question.objects.get(id=q_id)
                val = int(score)
                # Handle reverse scoring: 1->5, 2->4, 3->3, 4->2, 5->1
                if q.is_reverse_scoring:
                    val = 6 - val
                
                code = type_map[q.constitution_type.id]
                scores[code]['raw'] += val
            except (Question.DoesNotExist, ValueError):
                continue
                
        # Calculate Converted Scores
        results = {}
        for t in types:
            code = t.code
            raw_score = scores[code]['raw']
            
            # Calculate N (Total questions applicable to this gender)
            qs = Question.objects.filter(constitution_type=t)
            if gender == 'M':
                qs = qs.exclude(gender_limit='F')
            elif gender == 'F':
                qs = qs.exclude(gender_limit='M')
                
            n = qs.count()
            
            if n == 0:
                results[code] = 0
                continue
                
            # Formula: [(Raw - N) / (N * 4)] * 100
            # If user skipped questions, raw_score might be lower than n, resulting in negative?
            # Assuming user answers ALL applicable questions.
            converted = ((raw_score - n) / (n * 4)) * 100
            results[code] = round(max(0, converted), 2) # Ensure non-negative
            
        # Determine Main Constitution
        # Standard Algorithm (Simplified for Dev):
        # 1. Peaceful (A) is Yes if A >= 60 and others < 30 (or 40).
        # 2. Others are Yes if Score >= 40.
        
        main_type = "未判定"
        max_score = 0
        max_code = None
        
        # Check Biased types (B-I)
        biased_types = []
        for code, score in results.items():
            if code == 'A': continue
            if score >= 40:
                biased_types.append(code)
            if score > max_score:
                max_score = score
                max_code = code
        
        if not biased_types:
            # Check Peaceful
            score_a = results.get('A', 0)
            if score_a >= 60:
                main_type = "平和质"
            else:
                # If no biased types >= 40 and A < 60, technically "Tendency" or undiagnosed.
                # For simplicity, pick the highest biased score or A.
                if max_code:
                    main_type = f"{code_to_name[max_code]} (倾向)"
                else:
                    main_type = "平和质 (倾向)"
        else:
            # If multiple biased types, pick the one with max score or list them.
            # Here we pick the max one.
            main_type = code_to_name[max_code]

        # Save to DB
        analysis = ConstitutionAnalysis.objects.create(
            user=user,
            constitution_type=main_type,
            confidence_score=max_score, # Use max score as proxy for confidence
            analysis_details=results
        )
        
        # Update User Constitution
        user.constitution = main_type
        user.save()
        
        return Response({
            'main_type': main_type,
            'scores': results,
            'analysis_id': analysis.id
        })

class AcupointViewSet(viewsets.ReadOnlyModelViewSet):
    """
    穴位信息接口
    """
    queryset = Acupoint.objects.all()
    serializer_class = AcupointSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'cn_name', 'code']

    @action(detail=False, methods=['get'])
    def by_name(self, request):
        name = request.query_params.get('name')
        if not name:
            return Response({'error': 'Name parameter required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # 尝试精确匹配中文名
        try:
            acupoint = Acupoint.objects.get(cn_name=name)
        except Acupoint.DoesNotExist:
            # 尝试模糊匹配或英文名匹配
            acupoint = Acupoint.objects.filter(cn_name__icontains=name).first()
            if not acupoint:
                 acupoint = Acupoint.objects.filter(name__iexact=name).first()
        except Acupoint.MultipleObjectsReturned:
            # 如果有多个重名（不太可能），取第一个
             acupoint = Acupoint.objects.filter(cn_name=name).first()

        if not acupoint:
            return Response({'error': 'Acupoint not found'}, status=status.HTTP_404_NOT_FOUND)
            
        serializer = self.get_serializer(acupoint)
        return Response(serializer.data)
