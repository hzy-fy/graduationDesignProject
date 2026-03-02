import sqlite3
import os
from django.core.management.base import BaseCommand
from core.models import Meridian, AcupointPosition, AcupointFunction, Acupoint
from django.conf import settings

class Command(BaseCommand):
    help = 'Import acupoint data from Acupoint.db'

    def handle(self, *args, **options):
        # Locate the DB file
        base_dir = settings.BASE_DIR.parent
        db_path = os.path.join(base_dir, 'data', 'Acupoint.db')
        
        if not os.path.exists(db_path):
            self.stdout.write(self.style.ERROR(f'Database not found at {db_path}'))
            return

        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        try:
            # 1. Import Meridians
            self.stdout.write('Importing Meridians...')
            cursor.execute("SELECT id, name, cn_name FROM Meridian")
            for row in cursor.fetchall():
                m_id, name, cn_name = row
                Meridian.objects.update_or_create(
                    id=m_id,
                    defaults={
                        'name': name,
                        'cn_name': cn_name
                    }
                )

            # 2. Import Positions
            self.stdout.write('Importing Positions...')
            cursor.execute("SELECT id, name, cn_name FROM Position")
            for row in cursor.fetchall():
                p_id, name, cn_name = row
                AcupointPosition.objects.update_or_create(
                    id=p_id,
                    defaults={
                        'name': name,
                        'cn_name': cn_name
                    }
                )

            # 3. Import Functions
            self.stdout.write('Importing Functions...')
            cursor.execute("SELECT id, name, cn_name FROM Function")
            for row in cursor.fetchall():
                f_id, name, cn_name = row
                AcupointFunction.objects.update_or_create(
                    id=f_id,
                    defaults={
                        'name': name,
                        'cn_name': cn_name
                    }
                )

            # 4. Import Acupoints
            self.stdout.write('Importing Acupoints...')
            cursor.execute("SELECT id, meridian_id, position_id, function_id, code, pinyin, name, cn_name, position, cn_position, indication, cn_indication, compatibility, cn_compatibility, acupuncture, cn_acupuncture FROM Acupoint")
            
            rows = cursor.fetchall()
            self.stdout.write(f'Found {len(rows)} acupoints to import.')

            for i, row in enumerate(rows):
                if i % 50 == 0:
                    self.stdout.write(f'Processing row {i}...')
                (a_id, m_id, p_id, f_id, code, pinyin, name, cn_name, 
                 pos, cn_pos, ind, cn_ind, comp, cn_comp, acu, cn_acu) = row
                
                try:
                    meridian = Meridian.objects.get(id=m_id) if m_id else None
                except Meridian.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f'Meridian {m_id} not found for acupoint {a_id}'))
                    meridian = None

                try:
                    position_cat = AcupointPosition.objects.get(id=p_id) if p_id else None
                except AcupointPosition.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f'Position {p_id} not found for acupoint {a_id}'))
                    position_cat = None

                try:
                    function_cat = AcupointFunction.objects.get(id=f_id) if f_id else None
                except AcupointFunction.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f'Function {f_id} not found for acupoint {a_id}'))
                    function_cat = None
                
                Acupoint.objects.update_or_create(
                    id=a_id,
                    defaults={
                        'meridian': meridian,
                        'position_category': position_cat,
                        'function_category': function_cat,
                        'code': code,
                        'pinyin': pinyin,
                        'name': name,
                        'cn_name': cn_name,
                        'position': pos,
                        'cn_position': cn_pos,
                        'indication': ind,
                        'cn_indication': cn_ind,
                        'compatibility': comp,
                        'cn_compatibility': cn_comp,
                        'acupuncture': acu,
                        'cn_acupuncture': cn_acu
                    }
                )
                
            self.stdout.write(self.style.SUCCESS('Successfully imported all acupoint data'))

        except Exception as e:
            import traceback
            traceback.print_exc()
            self.stdout.write(self.style.ERROR(f'Error importing data: {e}'))
        finally:
            conn.close()
