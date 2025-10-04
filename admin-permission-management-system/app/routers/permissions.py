from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import SessionLocal
from app.models.permission import Permission
from app.schemas.permission import (
    PermissionCreate,
    PermissionOut,
    PermissionUpdate,
    BulkApplyRequest,
    ResponseBase,
)

router = APIRouter(prefix="/permissions", tags=["Permissions"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=ResponseBase)
def list_permissions(
    admin_id: Optional[int] = None,
    assigned_lawyer_id: Optional[int] = None,
    module: Optional[str] = Query(None, pattern=r"^(cases|judgments|hearings|documents|clients)$"),
    db: Session = Depends(get_db),
):
    q = db.query(Permission)
    if admin_id:
        q = q.filter(Permission.admin_id == admin_id)
    if assigned_lawyer_id:
        q = q.filter(Permission.assigned_lawyer_id == assigned_lawyer_id)
    if module:
        q = q.filter(Permission.module == module)
    items = q.all()
    return ResponseBase(success=True, message="OK", data={
        "items": [PermissionOut.model_validate(i).model_dump() for i in items]
    })


@router.post("/", response_model=ResponseBase)
def create_permission(payload: PermissionCreate, db: Session = Depends(get_db)):
    perm = Permission(
        admin_id=payload.admin_id,
        assigned_lawyer_id=payload.assigned_lawyer_id,
        module=payload.module,
        can_add=payload.can_add,
        can_edit=payload.can_edit,
        can_delete=payload.can_delete,
    )
    db.add(perm)
    db.commit()
    db.refresh(perm)
    return ResponseBase(success=True, message="Created", data={
        "permission": PermissionOut.model_validate(perm).model_dump()
    })


@router.put("/{permission_id}", response_model=ResponseBase)
def update_permission(permission_id: int, payload: PermissionUpdate, db: Session = Depends(get_db)):
    perm = db.query(Permission).filter(Permission.id == permission_id).first()
    if not perm:
        raise HTTPException(status_code=404, detail="Permission not found")
    for field in ["can_add", "can_edit", "can_delete"]:
        val = getattr(payload, field)
        if val is not None:
            setattr(perm, field, val)
    db.commit()
    db.refresh(perm)
    return ResponseBase(success=True, message="Updated", data={
        "permission": PermissionOut.model_validate(perm).model_dump()
    })


@router.delete("/{permission_id}", response_model=ResponseBase)
def delete_permission(permission_id: int, db: Session = Depends(get_db)):
    perm = db.query(Permission).filter(Permission.id == permission_id).first()
    if not perm:
        raise HTTPException(status_code=404, detail="Permission not found")
    db.delete(perm)
    db.commit()
    return ResponseBase(success=True, message="Deleted", data=None)


@router.post("/bulk-apply", response_model=ResponseBase)
def bulk_apply_permissions(req: BulkApplyRequest, db: Session = Depends(get_db)):
    # req.permissions: { moduleId: { add, edit, delete } }
    if not req.assigned_lawyer_ids:
        raise HTTPException(status_code=400, detail="No assignees provided")

    # Upsert per assigned_lawyer_id per module; delete when all toggles are false
    for lawyer_id in req.assigned_lawyer_ids:
        for module, toggles in req.permissions.items():
            existing = (
                db.query(Permission)
                .filter(
                  Permission.admin_id == req.admin_id,
                  Permission.assigned_lawyer_id == lawyer_id,
                  Permission.module == module,
                )
                .first()
            )
            add = bool(toggles.get("add", False))
            edit = bool(toggles.get("edit", False))
            delete = bool(toggles.get("delete", False))

            if not (add or edit or delete):
                # No permissions assigned → ensure no record exists
                if existing:
                    db.delete(existing)
                continue

            if existing:
                existing.can_add = add
                existing.can_edit = edit
                existing.can_delete = delete
            else:
                db.add(Permission(
                    admin_id=req.admin_id,
                    assigned_lawyer_id=lawyer_id,
                    module=module,
                    can_add=add,
                    can_edit=edit,
                    can_delete=delete,
                ))
    db.commit()
    return ResponseBase(success=True, message="Applied", data=None)
