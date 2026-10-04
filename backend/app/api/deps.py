from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from bson import ObjectId
from app.core.security import decode_token
from app.core.database import database

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
users_collection = database.get_collection("users")

async def get_current_user(token:str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code = status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate session credential",
        headers={'WWW-Authenticate': 'Bearer'}
    )

    payload = decode_token(token)

    if payload is None:
        raise credentials_exception
    
    user_id = payload.get('sub')
    
    if user_id is None or not ObjectId.is_valid(user_id):
        raise credentials_exception
    
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise credentials_exception
    
    user['id'] = str(user["_id"])

    return user



