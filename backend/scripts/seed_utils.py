from sqlalchemy import select
from sqlalchemy.orm import Session


def get_or_create(db: Session, model, defaults: dict | None = None, **kwargs):
    """Django-style get_or_create: look up a row by kwargs, or insert one.

    Returns (instance, created).
    """
    stmt = select(model).filter_by(**kwargs)
    instance = db.execute(stmt).scalars().first()
    if instance:
        return instance, False

    params = {**kwargs, **(defaults or {})}
    instance = model(**params)
    db.add(instance)
    db.flush()
    return instance, True
