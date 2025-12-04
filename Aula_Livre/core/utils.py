from django.contrib.auth.hashers import make_password, check_password

def set_hashed_password(instance, raw_password):
    instance.senha = make_password(raw_password)
    instance.save()
    
def check_raw_password(instance, raw_password):
    return check_password(raw_password, instance.senha)