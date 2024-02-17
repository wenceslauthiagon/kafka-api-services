# jwks-generator
Aqui temos os scripts para validacao do x5t e geracao do JWK Set.


## Validate x5t from URL

Para validar o x5t e x5t#S256 de um JWK, eh preciso informar a rota http que o arquivo se encontra.

```
./validate-x5t.sh [URL]
```

Este script busca o x5c que esta definido no JWK informado e calcula os valores de x5t e x5t#S256 a partir de comandos do `openssl`.
Apos calcular, eh feita a comparacao com os valores do JWK e informado se estao corretos ou nao.


## Generate JWK from file.crt

Para gerar um JWK, eh preciso informar o path do arquivo do certificado (geralment eh um arquivo.crt).
E o script ira printar o JWK gerado a partir desse certificado.

```
./generate-jwk.sh [FILE CERT]
```

Este script ler o certificado com o objetivo calcular os valores de `kid`, `x5t`, `x5c` e `n` a partir de comandos do `openssl`.
E no fim printar no terminal o JWK formatado com o uso da ferramenta `jq`.


### Observacao

A lista de valores no campo `x5c` deve ser informado de forma ordenada de acordo com a arvore de certificado que validam o certificado recebido como parametro. Ou seja, eh preciso abrir o certificado e verificar qual o certificado que valida o mesmo, em seguida, copiar o valor do mesmo e colocar na posicao seguinte da lista do `x5c`.
Pode utilizar o seguinte comando para pegar o valor formatado:

```sh
openssl x509 -in $FILECRT | grep -v -- ----- | tr -d '\n'
```

Com isso, eh preciso fazer para cada certificado da certificadora e preencher a lista do `x5c`, obtendo o resultado a seguir:

```json
{
  "...",
  "x5c": [
    "FILE CERT da assinatura",
    "FILE CERT da certificadora da assinatura",
    "FILE CERT da certificadora da certificadora",
    "FILE CERT da certificadora da certificadora da certificadora",
  ],
  "..."
}
```


### Requisitos

Precisa ter instalado as ferramentas `openssl` e `jq` instalados para poder utilizar esses scripts.
