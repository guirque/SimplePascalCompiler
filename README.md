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

Após isso ter sido feito, a cada vez que se quiser rodar novamente o contêiner, ou após modificações na configuração, podemos usar:

```
docker compose up --build
```

Aguarde até que apareça uma mensagem que indique que o servidor está rodando.

## Rotas


---

``POST /lexicalAnalysis``  
Retorna uma lista de tokens.  
Corpo da requisição:
```JSON
body: 
{
    "code": "codigo aqui"
}
```

Estrutura do token:
```typescript
type token = 
{
    lexema: string;
    classification?: string;
    line: number;
};
```

---