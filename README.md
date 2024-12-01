# Compilador Online (Com Etapas) de Simple Pascal

Uma ferramenta online para visualização de etapas de compilação para a linguagem fictícia Simple Pascal.

Esse repositório diz respeito ao <u>back end</u>.

## Objetivo

Desenvolver uma aplicação fullstack para a disciplina de Compiladores. O usuário deve poder digitar código de Simple Pascal e receber uma visualização dos resultados de etapas da compilação, como a análise léxica, sintática e semântica.

O projeto também é uma oportunidade de aplicar conhecimentos e estudos de desenvolvimento web, no geral. No caso do back end, estruturar um servidor com Docker, arquitetura com base em DDD e typescript.

## Como Rodar

Primeiramente, é necessário ter Docker instalado na máquina de escolha.

Com isso realizado, e tendo feito o download / pull do repositório, podemos subir o contêiner. Para isso, verifique que o motor do Docker esteja rodando e, no caminho do repositório, use o comando:

```
docker compose up
```

Isso vai configurar o ambiente e rodar o contêiner.

Após isso ter sido feito, a cada vez que se quiser rodar novamente o contêiner, pode-se executar o mesmo comando.  
Aguarde até que apareça uma mensagem que indique que o servidor está rodando.

## Rotas

### Observações

Todas as respostas das requisições abaixo seguem o formato descrito em ``CompilationResponse.ts``:
```typescript
export default interface compilationResponse
{
    lexical: token[],
    syntactic?: tree,
    semantic?: any,
    errors?: string[],
    warnings?: string[]
}
```
Em que:

- ``lexical``: possui uma lista de tokens. 

Estrutura do token:
```typescript
type token = 
{
    lexema: string;
    classification?: string;
    line: number;
};
```

- ``syntactic``: possui uma árvore de símbolos.

Estrutura da árvore:
```typescript
class tree 
{
    public children: tree[] = [];
    constructor(public value: treeValue){}

    addChild(node: tree)
    {
        this.children.push(node);
    }
}
```

Além disso, o corpo da requisição segue o formato:

```JSON
{
    "code": "codigo aqui"
}
```

### URLs

``POST /LexicalAnalysis``  
Retorna uma resposta com os campos ``lexical``, ``errors`` e ``warnings`` preenchidos.

``POST /SyntacticAnalysis``  
Retorna uma resposta com os campos ``lexical``, ``syntactic``, ``errors`` e ``warnings`` preenchidos.

---