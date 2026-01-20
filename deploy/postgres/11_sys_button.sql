-- 按钮资源表（全局唯一 code；menu_id 为空表示全局按钮）
CREATE TABLE IF NOT EXISTS public.sys_button (
    id            TEXT NOT NULL,
    code          VARCHAR(128) NOT NULL,
    description   VARCHAR(255),
    menu_id       INTEGER,
    status        "Status" NOT NULL DEFAULT 'ENABLED',
    sequence      INTEGER NOT NULL DEFAULT 0,
    created_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by    TEXT NOT NULL,
    updated_at    TIMESTAMP(3),
    updated_by    TEXT,

    CONSTRAINT sys_button_pkey PRIMARY KEY (id),
    CONSTRAINT sys_button_code_key UNIQUE (code)
);

CREATE INDEX IF NOT EXISTS sys_button_menu_id_idx ON public.sys_button(menu_id);
