import sys
import os

# PythonAnywhere 설정
# 'your_username' 부분을 실제 PythonAnywhere 사용자명으로 교체하세요
path = '/home/your_username/online-programbook'
if path not in sys.path:
    sys.path.insert(0, path)

# 환경 변수 설정 (PythonAnywhere Web 탭에서 직접 설정하는 것을 권장)
# os.environ['SECRET_KEY'] = 'your-very-strong-secret-key-here'
# os.environ['ADMIN_PASSWORD'] = 'your-admin-password'

from app import app as application
