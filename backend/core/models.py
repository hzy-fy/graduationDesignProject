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
    constitution = models.CharField(max_length=50, blank=True, null=True, verbose_name="当前体质")
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

class Medicine(models.Model):
    """
    药品数据库
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    generic_name = models.CharField(max_length=255, verbose_name="通用名称", db_index=True)
    trade_name = models.CharField(max_length=255, verbose_name="商品名称", blank=True, null=True, db_index=True)
    related_diseases = models.TextField(verbose_name="相关疾病", blank=True, null=True)
    description = models.TextField(verbose_name="性状", blank=True, null=True)
    ingredients = models.TextField(verbose_name="主要成份", blank=True, null=True)
    indications = models.TextField(verbose_name="适应症", blank=True, null=True)
    specification = models.TextField(verbose_name="规格", blank=True, null=True)
    adverse_reactions = models.TextField(verbose_name="不良反应", blank=True, null=True)
    dosage = models.TextField(verbose_name="用法用量", blank=True, null=True)
    contraindications = models.TextField(verbose_name="禁忌", blank=True, null=True)
    precautions = models.TextField(verbose_name="注意事项", blank=True, null=True)
    pregnancy_lactation_use = models.TextField(verbose_name="孕妇及哺乳期妇女用药", blank=True, null=True)
    pediatric_use = models.TextField(verbose_name="儿童用药", blank=True, null=True)
    geriatric_use = models.TextField(verbose_name="老人用药", blank=True, null=True)
    interactions = models.TextField(verbose_name="药物相互作用", blank=True, null=True)
    pharmacology_toxicology = models.TextField(verbose_name="药理毒理", blank=True, null=True)
    pharmacokinetics = models.TextField(verbose_name="药代动力学", blank=True, null=True)
    storage = models.TextField(verbose_name="贮藏", blank=True, null=True)
    validity = models.TextField(verbose_name="有效期", blank=True, null=True)

    def __str__(self):
        return self.generic_name

class ConstitutionType(models.Model):
    """
    体质类型定义 (如: 平和质, 气虚质...)
    """
    name = models.CharField(max_length=50) 
    code = models.CharField(max_length=10, blank=True) # A, B, C...
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.name

class Question(models.Model):
    """
    体质判定问卷题目
    """
    constitution_type = models.ForeignKey(ConstitutionType, on_delete=models.CASCADE, related_name='questions')
    content = models.TextField()
    is_reverse_scoring = models.BooleanField(default=False) # 是否反向计分
    order = models.IntegerField(default=0)
    
    GENDER_CHOICES = (
        ('M', '限男性'),
        ('F', '限女性'),
        ('N', '通用'),
    )
    gender_limit = models.CharField(max_length=1, choices=GENDER_CHOICES, default='N')

    def __str__(self):
        return f"{self.constitution_type.name} - {self.content[:20]}"

class Meridian(models.Model):
    """
    经络
    """
    name = models.CharField(max_length=64, blank=True, null=True)
    cn_name = models.CharField(max_length=64, blank=True, null=True, verbose_name="经络名称")
    
    def __str__(self):
        return self.cn_name or self.name

class AcupointPosition(models.Model):
    """
    穴位位置分类
    """
    name = models.CharField(max_length=64, blank=True, null=True)
    cn_name = models.CharField(max_length=64, blank=True, null=True, verbose_name="位置名称")

    def __str__(self):
        return self.cn_name or self.name

class AcupointFunction(models.Model):
    """
    穴位功能分类
    """
    name = models.CharField(max_length=64, blank=True, null=True)
    cn_name = models.CharField(max_length=64, blank=True, null=True, verbose_name="功能名称")

    def __str__(self):
        return self.cn_name or self.name

class Acupoint(models.Model):
    """
    穴位
    """
    meridian = models.ForeignKey(Meridian, on_delete=models.SET_NULL, null=True, blank=True, related_name='acupoints')
    position_category = models.ForeignKey(AcupointPosition, on_delete=models.SET_NULL, null=True, blank=True, related_name='acupoints')
    function_category = models.ForeignKey(AcupointFunction, on_delete=models.SET_NULL, null=True, blank=True, related_name='acupoints')
    
    code = models.CharField(max_length=16, blank=True, null=True)
    pinyin = models.CharField(max_length=64, blank=True, null=True)
    name = models.CharField(max_length=64, blank=True, null=True)
    cn_name = models.CharField(max_length=64, blank=True, null=True, verbose_name="穴位名称", db_index=True)
    
    position = models.TextField(blank=True, null=True)
    cn_position = models.TextField(blank=True, null=True, verbose_name="位置")
    
    indication = models.TextField(blank=True, null=True)
    cn_indication = models.TextField(blank=True, null=True, verbose_name="主治")
    
    compatibility = models.TextField(blank=True, null=True)
    cn_compatibility = models.TextField(blank=True, null=True, verbose_name="配伍")
    
    acupuncture = models.TextField(blank=True, null=True)
    cn_acupuncture = models.TextField(blank=True, null=True, verbose_name="针灸法")

    def __str__(self):
        return self.cn_name or self.name

