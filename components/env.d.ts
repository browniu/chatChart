// env.d.ts
interface ImportMetaEnv {
    readonly DEV: boolean;
    // 可以添加其他环境变量（比如VITE_XXX）
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
