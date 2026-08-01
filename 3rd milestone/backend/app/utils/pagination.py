def paginate(items: list, page: int, size: int) -> list:
    start = (page - 1) * size
    return items[start:start + size]
