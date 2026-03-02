from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ConstitutionType, Question, ConstitutionAnalysis, Acupoint, Meridian

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email'] # Adjust fields as needed

class QuestionSerializer(serializers.ModelSerializer):
    constitution_name = serializers.CharField(source='constitution_type.name', read_only=True)
    constitution_code = serializers.CharField(source='constitution_type.code', read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'content', 'constitution_type', 'constitution_name', 'constitution_code', 'is_reverse_scoring', 'order', 'gender_limit']

class ConstitutionResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConstitutionAnalysis
        fields = '__all__'

class MeridianSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meridian
        fields = '__all__'

class AcupointSerializer(serializers.ModelSerializer):
    meridian_name = serializers.CharField(source='meridian.cn_name', read_only=True)
    position_category_name = serializers.CharField(source='position_category.cn_name', read_only=True)
    function_category_name = serializers.CharField(source='function_category.cn_name', read_only=True)

    class Meta:
        model = Acupoint
        fields = '__all__'
