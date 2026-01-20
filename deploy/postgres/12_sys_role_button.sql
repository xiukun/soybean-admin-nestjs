-- 角色-按钮绑定表（按 domain 维度）
CREATE TABLE IF NOT EXISTS public.sys_role_button (
    role_id   TEXT NOT NULL,
    button_id TEXT NOT NULL,
    domain    TEXT NOT NULL,

    CONSTRAINT sys_role_button_pkey PRIMARY KEY (role_id, button_id, domain)
);

CREATE INDEX IF NOT EXISTS sys_role_button_button_id_idx ON public.sys_role_button(button_id);
