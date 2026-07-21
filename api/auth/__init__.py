import os
from dotenv import load_dotenv

load_dotenv()
USE_LOCAL_DB = os.getenv("USE_LOCAL_DB", "false").lower() == "true"

if USE_LOCAL_DB:
    from .mysql_auth import (
        get_connection,
        create_user,
        get_user_by_email,
        assign_role,
        get_user_roles,
        get_user_by_id,
        update_user_account,
        update_user_password,
    )
else:
    from .postgres_auth import (
        get_connection,
        create_user,
        get_user_by_email,
        assign_role,
        get_user_roles,
        get_user_by_id,
        update_user_account,
        update_user_password,
    )
