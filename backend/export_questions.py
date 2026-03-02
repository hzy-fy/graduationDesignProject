import os
import sys
import django

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import Question

qs = Question.objects.all().order_by('constitution_type__id', 'order')
for q in qs:
    print(f"[{q.constitution_type.code}{q.order}] {q.content}")
