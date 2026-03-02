import os
import sys
import re
import pandas as pd
import django

# Setup Django environment
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import ConstitutionType, Question

def import_questions():
    file_path = r'data/中医体质分类标准判定表.xls'
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    print("Reading Excel file...")
    df = pd.read_excel(file_path)
    
    current_type = None
    questions_count = 0
    
    # Regex patterns
    # Match "Name (Code型)" where name might contain 质 or 型 or nothing
    # e.g., 平和质 (A型), 痰湿型(E型), 血瘀(G型)
    type_pattern = re.compile(r'^(.*?)\s*\(([A-Z])型\)')
    question_pattern = re.compile(r'^\（(\d+)\）(.*)')
    
    # Iterate through rows
    # iterrows is slow but fine for small file
    for index, row in df.iterrows():
        # Column 0 contains the text
        col0 = str(row.iloc[0]).strip()
        
        # Check for Constitution Type
        type_match = type_pattern.match(col0)
        if type_match:
            name = type_match.group(1).strip()
            code = type_match.group(2).strip()
            
            # Fix typo in file for 特禀质
            if "特禀" in name and code == 'G':
                code = 'I'
            
            # Normalize name
            if name.endswith("型"):
                name = name[:-1] + "质"
            elif not name.endswith("质") and not name.endswith("型"):
                 if len(name) == 2: 
                     name += "质"

            print(f"Found Type: {name} ({code})")
            current_type, created = ConstitutionType.objects.get_or_create(
                name=name,
                defaults={'code': code}
            )
            if not created and current_type.code != code:
                current_type.code = code
                current_type.save()
            continue
            
        # Check for Question
        if current_type and question_pattern.match(col0):
            try:
                s1 = int(row.iloc[5])
                s5 = int(row.iloc[9])
            except (ValueError, TypeError):
                continue 
                
            q_match = question_pattern.match(col0)
            order = int(q_match.group(1))
            content = q_match.group(2).strip()
            
            # Determine scoring direction
            is_reverse = False
            if s1 == 5 and s5 == 1:
                is_reverse = True
            elif s1 == 1 and s5 == 5:
                is_reverse = False
            
            # Determine Gender Limit & Clean Content
            gender_limit = 'N'
            if '限女性' in content or '限女' in content:
                gender_limit = 'F'
            elif '限男性' in content or '限男' in content:
                gender_limit = 'M'
            
            # Clean content: Remove gender markers
            content = re.sub(r'[\(（]限[男女]性?[\)）]', '', content).strip()
                
            # Fix typos/punctuation
            content = content.replace('?', '？').replace(',', '，')
            content = content.replace('？？', '？')
            
            # Specific Fixes based on audit
            # A5: Fix punctuation in bracket
            if '耐受不了寒冷' in content:
                content = content.replace('。电扇', '、电扇')
            
            # C4: Fix missing bracket
            if '夏天不喜欢冷空调' in content and '（' not in content:
                content = content.replace('夏天', '（夏天')
                
            # H1, I2: Replace period with comma
            if '闷闷不乐。' in content:
                content = content.replace('。', '，')
            if '鼻痒。' in content:
                content = content.replace('。', '，')
                
            # F2: Typos
            content = content.replace('座疮', '痤疮')

            # Normalize common questions to ensure exact match for frontend deduplication
            if '容易疲乏' in content:
                content = '您容易疲乏吗？'
            elif '声音低弱' in content:
                content = '您说话声音低弱无力吗？'
            elif '忘事' in content or '健忘' in content:
                content = '您容易忘事（健忘）吗？'
            
            # G4: Remove incorrect question (额部油脂 is for Phlegm-Dampness, not Blood Stasis)
            # Standard Blood Stasis has 7 items. Current G has 8 items. G4 is likely a copy-paste error.
            if code == 'G' and '额部油脂' in content:
                print(f"Skipping incorrect question for {name}: {content}")
                continue
            
            # Re-calculate order if we skipped some?
            # Actually, order comes from regex group(1). If G4 is skipped, G5 will still be order 5.
            # This is fine, as long as frontend sorts by order.
            # But for calculation, we need to be careful.
            # Standard calculation relies on Total Questions (N).
            # If we skip G4, N will be 7, which is correct for Standard.
            
            # Create/Update Question
            Question.objects.update_or_create(
                constitution_type=current_type,
                order=order,
                defaults={
                    'content': content,
                    'is_reverse_scoring': is_reverse,
                    'gender_limit': gender_limit
                }
            )
            questions_count += 1

    print(f"Import finished. Total questions: {questions_count}")

if __name__ == '__main__':
    import_questions()
