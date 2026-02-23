from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
import uuid

class User(AbstractUser):
    """
    自定义用户模型，使用手机号作为唯一标识
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(_('phone number'), max_length=11, unique=True)
    name = models.CharField(_('name'), max_length=100, blank=True)
    # 移除默认的 username 字段，或将其设为非必须/自动生成
    username = models.CharField(max_length=150, unique=True, blank=True, null=True) 
    
    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = ['username'] # create_superuser 时需要

    def __str__(self):
        return self.phone

class ConstitutionAnalysis(models.Model):
    """
    体质分析记录
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='constitution_analyses')
    constitution_type = models.CharField(max_length=50) # 如：阴虚体质
    confidence_score = models.FloatField() # 置信度
    analysis_details = models.JSONField(default=dict) # 详细分析数据
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

class DrugAnalysisHistory(models.Model):
    """
    药物禁忌分析历史
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='drug_analyses')
    drug_name = models.CharField(max_length=200)
    constitution_types = models.JSONField(default=list) # 分析时基于的体质类型列表
    contraindication_result = models.JSONField(default=dict) # 分析结果
    ai_explanation = models.TextField(blank=True) # AI 解释
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

class UserFavorite(models.Model):
    """
    用户收藏的药物
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    drug_name = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'drug_name')
