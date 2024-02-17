## What was done in this PR? (in English - required)

Describe here all changes and additions made to the code in list format

 - It is important to be in English because this is where we make our version change log and make it available to customers
 
## Have migrate? (optional)

#### New migrate adds field X in table y

```
  20230328151905-add_users_withdraws_settings_table.js
```

## Which api were involved in this PR?

- Example: api-users / api-paas

##  Environment variables (Optional) 

***.otc.env***

```
#Exchange quotation
APP_ZROBANK_PARTNER_ID=112233
APP_TOPAZIO_AUTH_BASE_URL=http://localhost:7001/topazio/auth
APP_TOPAZIO_AUTH_CLIENT_ID=alpine
APP_TOPAZIO_AUTH_CLIENT_SECRET=secret
```

## Como testar ? (Português - obrigatório)

Descreva aqui os passo a passos para realizar os testes, são informações importantes para o time de QA

## Outras informações 

- Não esqueça de preencher o campo 'etiquetas'
- Solicitar aprovadores para o PR
- Mover o card no Jira para a fila 'Ready for Code Review'
- Fazer pequenos commits usando o 'Conventional Commits'
- **Verificar nomenclatura das branches**
  - **feature/LAB-0000 = Novas features**
  - **bugfix/LAB-0000  = Bug em develop**
  - **hotfix/LAB-0000  = Bug em prod**
