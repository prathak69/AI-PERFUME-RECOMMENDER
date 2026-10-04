from os import name
from pymongo import results
from fastapi import APIRouter, HTTPException, status
from datetime import datetime
from app.core.database import database
from app.core.security import hash_password, verify_password, create_access_token
from app.schemas.user import UserRegistration, UserLogin, TokenResponse

router = APIRouter()
user_collection = database.get_collection('users')

@router.post('/register', response_model=TokenResponse)
async def register(user_in: UserRegistration):
    normalize_email = user_in.email.lower().strip()
    existing = await user_collection.find_one({"email": normalize_email})
    if existing:
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST,
            detail = "An account with this email address already exists."
        )
    
    user_doc = {
        "email": normalize_email,
        "hashed_password": hash_password(user_in.password),
        "full_name": user_in.name.strip(),
        "created_at": datetime.utcnow().isoformat()
    }

    result = await user_collection.insert_one(user_doc)
    user_id = str(result.inserted_id)

    token = create_access_token(data={"sub":user_id, "email": user_doc['email']})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user_doc["email"],
            "name": user_doc["full_name"]
        }
    }

@router.post('/login', response_model=TokenResponse)
async def login(user_in:UserLogin) -> dict:
    normalized_email = user_in.email.lower().strip()
    user = await user_collection.find_one({'email': normalized_email})

    if not user or not verify_password(user_in.password, user['hashed_password']):
        raise HTTPException(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail = "Invalid password or email"
        )

    user_id = str(user['_id'])
    token = create_access_token(data={"sub": user_id, "email": user["email"]})
    return {
        'access_token': token,
        'token_type': 'bearer',
        'user': {
            'id': user_id,
            'email': user['email'],
            'name': user['full_name'],
        }
    }
        

    