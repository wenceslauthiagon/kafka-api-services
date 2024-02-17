const { v4: uuidv4 } = require('uuid');

export class Support {
  static findInJson(obj, keyToFind, position = 1) {
    let result = null;
    let count = 0;

    function traverse(obj) {
      if (result !== null) return;

      if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
          traverse(obj[i]);
        }
      } else if (typeof obj === 'object' && obj !== null) {
        for (let key in obj) {
          if (key === keyToFind) {
            count++;
            if (count === position) {
              result = obj[key];
              return;
            }
          }
          traverse(obj[key]);
        }
      }
    }

    traverse(obj);
    return result;
  }

  static expect(obj = null, path, value = null, position = 1) {
    if (obj !== null && path) {
      const key = this.findInJson(obj, path, position);
      expect(key, `validate path ${path}:`).not.eq(undefined);
      expect(key, `validate path ${path}:`).not.eq(null);
      if (value !== null) {
        expect(key).to.eq(value);
      }
      return key;
    } else if (obj !== null && !path) {
      expect(obj, `validate path ${path}:`).not.eq(undefined);
      expect(obj, `validate path ${path}:`).not.eq(null);
      return path;
    }
  }

  static _time(sec) {
    afterEach(async () => {
      await new Promise((resolve) => setTimeout(resolve, sec));
    });
  }

  static async setCypressEnv(token, env = 'auth') {
    const auth = Cypress.env('auth');
    const access_token = Cypress.env('access_token');
    console.log(auth, access_token);
    if (Cypress.env(env) === null && token !== 'null') {
      Cypress.env('auth', {
        nonce: uuidv4(),
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      });

      Cypress.env('access_token', {
        nonce: uuidv4(),
        Accept: 'application/json',
        'x-access-token': `${token}`,
      });
      Cypress.env('not_auth', {
        nonce: uuidv4(),
        Accept: 'application/json',
      });
      return Cypress.env(env);
    } else {
      return Cypress.env(env);
    }
  }

  static async headers(username = '+5581995657777', password = 'abcd1234') {
    const auth = Cypress.env('auth');
    const access_token = Cypress.env('access_token');
    console.log(auth, access_token);
    if (auth !== null || access_token !== null) {
      return 'null';
    } else {
      return new Promise(async (resolve, reject) => {
        await cy
          .request({
            method: 'POST',
            url: 'https://api-dev1rrg.zrobank.biz:2083/v2/auth/signin',
            body: {
              recaptcha_key: 'recaptcha-app-key',
              recaptcha_token: 'action-token',
              recaptcha_action: 'action-name',
              username,
              password,
            },
          })
          .then((response) => {
            const token = this.findInJson(response, 'Response Body');
            resolve(token.data.access_token);
          });
      });
    }
  }

  static async post_request(endpoint, body = null, headers) {
    return await cy
      .request({
        method: 'POST',
        url: endpoint,
        body: JSON.stringify(body) !== null ? body : null,
        headers: headers,
        failOnStatusCode: false,
      })
      .then((response) => {
        this.expect(response, 'body');
        return response;
      });
  }

  static async put_request(endpoint, body = null, headers) {
    return await cy
      .request({
        method: 'PUT',
        url: endpoint,
        body: JSON.stringify(body) !== null ? body : null,
        headers: headers,
        failOnStatusCode: false,
      })
      .then((response) => {
        this.expect(response, 'body');
        return response;
      });
  }

  static async get_request(endpoint, headers) {
    return await cy
      .request({
        method: 'GET',
        url: endpoint,
        headers: headers,
        failOnStatusCode: false,
      })
      .then((response) => {
        return response;
      });
  }

  static async delete_request(endpoint, body = {}, headers) {
    return await cy
      .request({
        method: 'DELETE',
        url: endpoint,
        headers: headers,
        failOnStatusCode: false,
        body: body,
      })
      .then((response) => {
        return response;
      });
  }

  static generateString(num) {
    return Array.from({ length: num }, () =>
      String.fromCharCode(Math.floor(Math.random() * 26) + 65),
    ).join('');
  }

  static generateNumber(num, asString = false) {
    let numeros = '';
    for (let i = 0; i < num; i++) {
      numeros += Math.floor(Math.random() * 10);
    }
    return asString ? numeros : Number(numeros);
  }
  static uuid_gen() {
    return uuidv4();
  }

  static async write_json(path, name, data) {
    await cy.writeFile(`../tests/cypress/fixtures/${path}/${name}.json`, data);
  }

  static async read_json(path, name) {
    return cy
      .readFile(`../tests/cypress/fixtures/${path}/${name}.json`)
      .then((json) => {
        return json;
      });
  }

  static generateData(day, data = null) {
    const dataAtual = new Date();
    if (data == null) {
      if (day > 0) {
        dataAtual.setDate(dataAtual.getDate() + day);
      }
    }
    if (data === 'before') {
      dataAtual.setDate(dataAtual.getDate() - day);
    }
    const ano = dataAtual.getFullYear();
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
    const dia = String(dataAtual.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  static generateCpf() {
    function dig(n1, n2, n3, n4) {
      const nums = n1.split('').concat(n2.split(''), n3.split(''));
      if (n4 !== undefined) {
        nums[9] = n4;
      }
      let x = 0;
      for (let i = n4 !== undefined ? 11 : 10, j = 0; i >= 2; i--, j++) {
        x += parseInt(nums[j]) * i;
      }
      const y = x % 11;
      return y < 2 ? 0 : 11 - y;
    }

    function aleatorio() {
      const aleat = Math.floor(Math.random() * 999);
      return ('' + aleat).padStart(3, '0');
    }

    const num1 = aleatorio();
    const num2 = aleatorio();
    const num3 = aleatorio();
    const dig1 = dig(num1, num2, num3);
    const dig2 = dig(num1, num2, num3, dig1);

    return `${num1}${num2}${num3}${dig1}${dig2}`;
  }
}

export function Env() {
  return Cypress.env(Cypress.env('environment'));
}
