# Funções criadas em support para melhoria do código


## Tipos de funções:

- **findInJson**
- **expect**
- **_time**
- **setCypressEnv**
- **headers**
- **post_request**
- **put_request**
- **get_request**
- **delete_request**
- **generateString**
- **generateNumber**
- **uuid_gen**
- **write_json**
- **read_json**
- **Env**
- **generateData**
- **generateCpf**

## Funcionalidades: 

      -Nos exemplos a seguir foi importado como exemplo da class Support criado da pasta support
      import { Support as _cy } from '../../support/support';

  ## **<u>findInJson</u>**:


  A função `findInJson` é responsável por buscar um valor específico em um objeto JSON.

Parâmetros:
- `obj`: O objeto JSON onde a busca é realizada (obrigatório).
- `keyToFind`: A chave que estamos procurando dentro do objeto JSON (obrigatório).
- `position`: A posição da ocorrência da chave no objeto JSON (opcional, padrão é 1).

A função utiliza uma abordagem recursiva para percorrer o objeto JSON e suas propriedades. Se a chave especificada for encontrada na posição especificada (ou na primeira posição se a posição não for fornecida), o valor correspondente à chave será retornado. Caso a chave não seja encontrada no objeto JSON, a função retornará `null`.

`Exemplo:`

Nesse exemplo temos uma resposta `response` de uma requisição, e queremos obter o ID dessa resposta.

```javaScript
const id = _cy.findInJson(response, 'id');
```


## **<u>expect</u>**:

A função `expect` é responsável por realizar verificações em um objeto JSON (`obj`) com base no caminho especificado (`path`) e, opcionalmente, em um valor (`value`) esperado.

Parâmetros:
- `obj`: O objeto JSON onde a busca ou validação é realizada (obrigatório).
- `path`: O caminho que representa a chave a ser verificada no objeto JSON (obrigatório).
- `value`: O valor esperado que a chave especificada deve possuir (opcional, padrão é `null`).
- `position`: A posição da ocorrência da chave no objeto JSON, usado pela função `findInJson` (opcional, padrão é 1).

Se `obj` e `path` são fornecidos, a função utiliza a função `findInJson` (descrita anteriormente) para buscar o valor da chave no objeto JSON. Em seguida, são realizadas as seguintes verificações:
- Verifica se o valor da chave não é `undefined`.
- Verifica se o valor da chave não é `null`.
- Se o parâmetro `value` é fornecido, a função verifica se o valor da chave é igual a `value`.

Se `obj` é fornecido, mas `path` não, a função apenas verifica se o próprio objeto não é `undefined` ou `null`.

`Exeplos:`

No primeiro exemplo tem uma responsta `response` de uma requisição e verificar se o campo `name` existe e não é null ou undefined

No segundo exemplo tem uma `resposta` de uma requisição e verifica se o campo `age` possui o valor 25

No terceiro exemplo tem uma resposta `response` de uma requisição e verifica se a resposta inteira não é null ou undefined

```javascript

_cy.expect(response, 'name');

_cy.expect(response, 'age', 25);

_cy.expect(response);
```


## **<u>_time</u>**:

A função `_time` é utilizado para adicionar um atraso após cada teste executado no ambiente de testes.

Parâmetros:
- `sec`: O tempo em segundos que deseja-se aguardar após cada teste (obrigatório).

A função utiliza `afterEach`, um método para garantir que a pausa seja aplicada após cada execução de teste.

Dentro da função `_time`, utilizamos a função `setTimeout` para aguardar o tempo especificado em segundos

`Exemplo:`

Nesse exmplo é aplicado um atraso de 1 minuto após cada execução.

```javascript
_cy._time(60000);
```


## **<u>setCypressEnv</u>**:

A função `setCypressEnv` é responsável por configurar os cabeçalhos (headers) necessários para a autorização de uma requisição, por padrão já é passado no parâmetro igual a `auth`

Existem três opções disponíveis para a configuração de cabeçalhos:

1. `'auth'`: Para uma requisição que requer um token de autorização (bearer token). Nesse caso, é necessário fornecer um token específico para autenticar a requisição.

2. `'access_token'`: Para uma requisição que necessita apenas do token de acesso (access token). É necessário fornecer um token específico para a requisição.

3. `'not-token'`: Para uma requisição que não requer nenhuma autorização. Neste caso, não é necessário fornecer um token específico, pois a requisição não exigirá autenticação.

Parâmetros:
- `token`: um token gerado deve ser passado(obrigatório).

**Observação:**
 Essa função deve ser usada dentro de um before.

`Exeplos:`

```javaScript
let headers;

 before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token, 'access_token');
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token, 'not-token');
  });
  ```

  ## **<u>headers</u>**:

A função `headers` é responsável por gerar o token de autorização necessário para as requisições que serão realizadas. Ela realiza uma chamada de requisição POST para autenticar e obter o token de acesso, é passada no parâmetro da função acima <u>setCypressEnv</u>.

**Observação:**
 Essa função deve ser usada dentro de um before.

 `Exeplos:`


 ```javaScript
let token;

   before(async () => {
    token = await _cy.headers();
  });
```

  ## **<u>post_request</u>**:

A função `post_request` é utilizada para realizar uma requisição do tipo POST para um determinado endpoint.

Parâmetros:
- `endpoint`: O URL do endpoint onde a requisição será enviada (obrigatório).
- - `body`: O corpo da requisição no formato JSON (opcional, padrão é `null`).
- `headers`: Os cabeçalhos (headers) da requisição que podem incluir informações de autorização (obrigatório), gerado na função <u>headers</u> 

Se o parâmetro `body` for fornecido e for diferente de `null`, a função converte o corpo da requisição em formato JSON antes de enviar a requisição. Caso contrário, o corpo da requisição permanece como `null`.

`Exemplo:`

```javaScript
const body = {
    name: Zro
}
 const response = await _cy.post_request(env.signup, body, headers);
 ```

## **<u>put_request</u>**:

A função `put_request` é utilizada para realizar uma requisição do tipo PUT para um determinado endpoint.

Parâmetros:
- `endpoint`: O URL do endpoint onde a requisição será enviada (obrigatório).
- `body`: O corpo da requisição no formato JSON (opcional, padrão é `null`).
- `headers`: Os cabeçalhos (headers) da requisição que podem incluir informações de autorização (obrigatório).

Se o parâmetro `body` for fornecido e for diferente de `null`, a função converte o corpo da requisição em formato JSON antes de enviar a requisição. Caso contrário, o corpo da requisição permanece como `null`.

`Exemplo:`

```javaScript
const body = {
    lastName: Zrobank
}
 const response = await _cy.post_request(env.signup, body, headers);
 ```

 ## **<u>get_request</u>**:

A função `get_request` é utilizada para realizar uma requisição do tipo GET para um determinado endpoint.

Parâmetros:
- `endpoint`: O URL do endpoint onde a requisição será enviada (obrigatório).
- `headers`: Os cabeçalhos (headers) da requisição que podem incluir informações de autorização (obrigatório).

`Exemplo:`

```javaScript
const response = await _cy.get_request(endpoint, headres);
```


## **<u>delete_request</u>**:

A função `delete_request` é utilizada para realizar uma requisição do tipo DELETE para um determinado endpoint.

Parâmetros:
- `endpoint`: O URL do endpoint onde a requisição será enviada (obrigatório).
- `body`: O corpo da requisição no formato JSON (opcional, padrão é `{}`).
- `headers`: Os cabeçalhos (headers) da requisição que podem incluir informações de autorização (obrigatório).

`Exemplo:`

```javaScript
 const response = await _cy.delete_request(endpoint, headers);
 ```


 ## **<u>generateString</u>**:

A função `generateString` é utilizada para gerar uma string aleatória com um determinado número de caracteres.

Parâmetros:
- `num`: O número de caracteres que a string gerada deve possuir (obrigatório).

A função utiliza o método `Array.from()` para criar um novo array com o comprimento especificado (`num`). Em seguida, utiliza a função `String.fromCharCode()` para converter os valores numéricos gerados aleatoriamente em caracteres do alfabeto maiúsculo.

A expressão `Math.floor(Math.random() * 26) + 65` gera um número inteiro aleatório entre 65 e 90 (valores ASCII que correspondem às letras maiúsculas de A a Z). Esses números são convertidos em caracteres do alfabeto maiúsculo usando `String.fromCharCode()`.


`Exemplo:`

Nesse exemplo foi gerado 5 string.

```javaScript
 const generate_password = _cy.generateString(5);
 ```

 ## **<u>generateNumber</u>**:

A função `generateNumber` é utilizada para gerar um número inteiro aleatório com um determinado número de dígitos.

Parâmetros:
- `num`: O número de dígitos que o número gerado deve possuir (obrigatório).

A função utiliza um loop `for` para iterar `num` vezes e, em cada iteração, gera um dígito aleatório entre 0 e 9 utilizando a expressão `Math.floor(Math.random() * 10)`. Os dígitos gerados são concatenados na variável `numeros`.

Ao final das iterações, a função retorna o valor de `numeros` como um número inteiro usando `Number(numeros)`.

`Exemplo:`

Nesse exemplo foi gerado 5 números.

```javaScript
    const string_ = _cy.generateNumber(5);
 ```

 ## **<u>uuid_gen</u>**:

A função `uuid_gen` é utilizada para gerar um UUID v4, função criada para não importar nos testes a biblioteca `const { v4: uuidv4 } = require('uuid');`.


`Exemplo:`

```javaScript
const = _cy.uuid_gen()
 ```

 ## **<u>write_json</u>**:

A função `write_json` é utilizada para escrever dados em um arquivo JSON em um determinado caminho.

**Observação:**
por padrão o caminho onde os arquivos serão salvos é na pasta fixtures `../tests/cypress/fixtures/${path}/${name}.json`.

**obrigatório:** deve criar o arquivo json dentro de um `it`, pois só é aceitavél a criação no modo `run` do cypress dessa forma (já foi testado).

Parâmetros:
- `path`: O caminho relativo onde o arquivo JSON será gravado (obrigatório).
- `name`: O nome do arquivo JSON (obrigatório).
- `data`: Os dados que serão gravados no arquivo JSON (obrigatório).

`Exemplo:`

nesse exemplo é criado um arquivo json na pasta teste e o nome do arquivo é teste.json guardando o valor do id_teste dentro de um objeto id no arquivo.

```javaScript
const id_teste = '123456789'

  it('create JSON id', () => {
    _cy.writeFile('../tests/cypress/fixtures/teste/teste.json', {
     { id: id_teste },
    });
  });
 ```

 ## **<u>read_json</u>**:

A função `read_json` é utilizada para ler o conteúdo de um arquivo JSON a partir de um determinado caminho.

**Observação:** deve ser usado dentro de um `before` para o valor criado ser retornado antes dos testes criado no escopo dentro do describe.

Parâmetros:
- `path`: O caminho relativo onde o arquivo JSON será lido (obrigatório).
- `name`: O nome do arquivo JSON (obrigatório).

`Exemplo:`

Nesse exemplo, o valor armazenado no arquivo `teste.json` da pasta `teste` no diretório `fixtures` será retornado.

```javaScript
  before(async () => {
    await _cy
      .readFile('../tests/cypress/fixtures/teste/teste.json')
      .then((data) => {
       const id = data.id;
      });
  });
 ```

## **<u>Env</u>**:

A função `Env()` é utilizada para acessar o valor de uma variável de ambiente no Cypress, especificamente a variável de ambiente cujo nome é determinado pela variável de ambiente 'environment'.

Configurações no arquivo `cypress.json`:

No arquivo `cypress.json`, a chave `"env"` é utilizada para definir as variáveis de ambiente para diferentes ambientes (DEV, PROD, QA, LOCAL) e suas respectivas URLs. A variável de ambiente `'environment'` está configurada com o valor `"DEV"`, o que significa que, no momento, estamos utilizando as URLs configuradas para o ambiente de desenvolvimento.

Retorno:

- O valor da variável de ambiente correspondente ao ambiente atual definido em `'environment'`.
  
`Exemplo:`

O arquivo cypress.json define variáveis de ambiente para diferentes ambientes (DEV, PROD, QA, LOCAL). Cada ambiente tem suas configurações específicas. A função `Env()` acessa o valor da variável de ambiente atual, permitindo utilizar URLs e configurações correspondentes ao ambiente selecionado.

no arquivo_teste.cy.js é acessado a url login do arquivo JSON

```javaScript

cypress.json:

{
    "env": {
        "environment": "DEV",
        "DEV": {
            "login": "https://api-dev1rrg.zrobank.biz:2083/v2/auth/signin",
        },
        "PROD": {},
        "QA": {},
        "LOCAL": {
            "login": "http://localhost:3000/v2/auth/signin",
        }
    },
}

arquivo_teste.cy.js

 let env = Env();

 ...restante do código

 it('teste de validate login', async () =>{
     const response = await _cy.post_request(env.login, body, headers);
 })
 ```

 ## **<u>cypress.json</u>**:

O arquivo `JSON` foi criado para armazenar as `URLs` dos endpoints, evitando que elas sejam expostas diretamente no código (arquivo de teste). Essa organização torna o código mais limpo e facilita o acesso e a alteração dos ambientes, incluindo Dev, Produção, QA e Local. Isso nos permite configurar e testar diferentes ambientes de forma segura e eficiente.


Na variável de ambiente `environment` é passado como valor `DEV`, como retorno vai  ser acessado as `url` na variável de ambiente `DEV`, caso queira saber como chamar esse arquivo JSON nos teste a uma explicação deixando bem claro na função **<u>Env</u>**: acima

`Padrão do código:`

```javaScript
cypress.json:

{
    "env": {
        "environment": "DEV",
        "DEV": {
            "exemplo": "https://exemplo.com",
        },
        "PROD": {},
        "QA": {},
        "LOCAL": {
            "exemplo": "https://exemplo.com",
        }
    },
}
```

## **<u>generateData</u>:**
O `generateData` é uma função estática assíncrona responsável por criar datas atuais ou futuras com base em um intervalo em dias.

Parâmetros:

- `day` (obrigatório): O número de dias para avançar na data atual e gerar uma data futura. 

- `data` (opcional): Ao passar string 'before', com base na data atual a função vai reduzir a data de acordo com o número de dias passado em `day`. 
  
**Observação:** padrão é 0 para data atual.

`Exemplos:`

No primeiro exemplo, é passado por parâmetro o número `0`, que resultará na data atual.

No segundo exemplo, é passado por parâmetro o número `5`, que resultará em uma data futura, cinco dias após a data atual.

Para obter uma data recuada com base na data atual, pode-se passar o valor 'before', que será retornado a data atual menos `3` dias.

```javaScript
_cy.generateData(0)

_cy.generateData(5)

_cy.generateData(3, 'before')
```

## **<u>generateCpf</u>:**

A função `generateCpf` é responsável por criar números do documento `CPF` .

**Observação:** gera apenas os números sem pontuação.

`Exemplos:`

```javaScript
const cpf = _cy.generateCpf();

response: "16422725310"
```