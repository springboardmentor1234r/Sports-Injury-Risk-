
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from models.player import PlayerData
from models.player_db import Player
from database import get_db

router = APIRouter()

@router.post("/player")
def add_player(player: PlayerData, db: Session = Depends(get_db)):
    new_player = Player(
        name=player.name,
        age=player.age,
        height=player.height,
        weight=player.weight,
        sport=player.sport
    )

    db.add(new_player)
    db.commit()
    db.refresh(new_player)

    return {
        "message": "Player saved successfully",
        "id": new_player.id
    }

@router.get("/players")
def get_players(db: Session = Depends(get_db)):
    players = db.query(Player).all()
    return players

@router.put("/player/{player_id}")
def update_player(player_id: int, player: PlayerData, db: Session = Depends(get_db)):
    existing_player = db.query(Player).filter(Player.id == player_id).first()

    if not existing_player:
        return {"message": "Player not found"}

    existing_player.name = player.name
    existing_player.age = player.age
    existing_player.height = player.height
    existing_player.weight = player.weight
    existing_player.sport = player.sport

    db.commit()
    db.refresh(existing_player)

    return {
        "message": "Player updated successfully",
        "player": existing_player
    }

@router.delete("/player/{player_id}")
def delete_player(player_id: int, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()

    if not player:
        return {"message": "Player not found"}

    db.delete(player)
    db.commit()

    return {"message": "Player deleted successfully"}