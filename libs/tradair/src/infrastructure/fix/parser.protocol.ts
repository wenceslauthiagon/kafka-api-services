import * as fs from 'fs';
import { parse } from 'fast-xml-parser';
import * as moment from 'moment';
import { FixDecoded, FixDecodedMessage } from './models.protocol';

const fixFieldParsers = {
  AMT: () => {
    throw new Error(`AMT parser not implemented`);
  },
  BOOLEAN: (x) => x === 'Y',
  CHAR: (x) => x,
  CURRENCY: (x) => x,
  DATA: () => {
    throw new Error(`DATA parser not implemented`);
  },
  DAYOFMONTH: () => {
    throw new Error(`DAYOFMONTH parser not implemented`);
  },
  EXCHANGE: () => {
    throw new Error(`EXCHANGE parser not implemented`);
  },
  FLOAT: parseFloat,
  INT: parseInt,
  LOCALMKTDATE: (x) => moment(x, 'YYYYMMDD').toDate(),
  MONTHYEAR: () => {
    throw new Error(`MONTHYEAR parser not implemented`);
  },
  MULTIPLEVALUESTRING: () => {
    throw new Error(`MULTIPLEVALUESTRING parser not implemented`);
  },
  NUMINGROUP: () => {
    throw new Error(`NUMINGROUP parser not implemented`);
  },
  PRICE: parseFloat,
  PRICEOFFSET: parseFloat,
  QTY: parseFloat,
  STRING: (x) => x,
  UTCDATE: () => {
    throw new Error(`UTCDATE parser not implemented`);
  },
  UTCTIMEONLY: () => {
    throw new Error(`UTCTIMEONLY parser not implemented`);
  },
  UTCTIMESTAMP: (x) => moment(x, 'YYYYMMDD-HH:mm:ss.SSS').toDate(),
};

const fixFieldBuilders = {
  AMT: () => {
    throw new Error(`AMT builder not implemented`);
  },
  BOOLEAN: (x) => (x ? 'Y' : 'N'),
  CHAR: (x) => x,
  CURRENCY: (x) => x,
  DATA: () => {
    throw new Error(`DATA builder not implemented`);
  },
  DAYOFMONTH: () => {
    throw new Error(`DAYOFMONTH builder not implemented`);
  },
  EXCHANGE: () => {
    throw new Error(`EXCHANGE parser not implemented`);
  },
  FLOAT: (x) => `${x}`,
  INT: (x) => `${x}`,
  LOCALMKTDATE: (x) => moment(x).format('YYYYMMDD'),
  MONTHYEAR: () => {
    throw new Error(`MONTHYEAR builder not implemented`);
  },
  MULTIPLEVALUESTRING: () => {
    throw new Error(`MULTIPLEVALUESTRING builder not implemented`);
  },
  NUMINGROUP: () => {
    throw new Error(`NUMINGROUP builder not implemented`);
  },
  PRICE: (x) => `${x}`,
  PRICEOFFSET: (x) => `${x}`,
  QTY: (x) => `${x}`,
  STRING: (x) => x,
  UTCDATE: () => {
    throw new Error(`UTCDATE builder not implemented`);
  },
  UTCTIMEONLY: () => {
    throw new Error(`UTCTIMEONLY builder not implemented`);
  },
  UTCTIMESTAMP: (x) => moment(x).format('YYYYMMDD-HH:mm:ss.SSS'),
};

type FixToken = {
  tag: string;
  value: string;
};

type FixValue = {
  enum: string;
  description: string;
};

type FixFieldInfo = {
  number: string;
  name: string;
  type: string;
  value?: FixValue[];
};

type FixStructureAttributes = {
  name: string;
  required: string;
};

type FixField = FixStructureAttributes;
type FixComponent = FixStructureAttributes;

type FixStructure = {
  field: FixField[] | FixField;
  component?: FixComponent[] | FixComponent;
  group?: FixGroup[] | FixGroup;
};

type FixNormalizedStructure = {
  field: FixField[];
  component?: FixComponent[];
  group?: FixGroup[];
};

type FixGroup = FixStructureAttributes & FixStructure;

type FixHeader = FixStructure;
type FixTrailer = FixStructure;

type FixMessage = FixStructure & {
  name: string;
  msgtype: string;
  msgcat: string;
};

type Value = {
  [key: string]: any;
};

export class FixParser {
  private fixHeader: FixHeader;
  private fixTrailer: FixTrailer;
  private fixFieldInfoNumberDict: FixFieldInfo[];
  private fixFieldInfoNameDict: FixFieldInfo[];
  private fixMessageTypeDict: FixMessage[];
  private fixMessageNameDict: FixMessage[];
  private fixComponentsNameDict: FixComponent[];
  private headerFieldsNumbers: string[];
  private trailerFieldsNumbers: string[];

  load(xmlFixModelFile: string) {
    // Read XML file.
    const xml = fs.readFileSync(xmlFixModelFile).toString('utf-8');

    // Parse XML model.
    const model = parse(
      xml,
      {
        ignoreAttributes: false,
        attributeNamePrefix: '',
      },
      true,
    );

    // Get recognized parsers list.
    const parsers = Object.keys(fixFieldParsers);
    const builders = Object.keys(fixFieldBuilders);

    // Check if all model required parses are supported.
    const fieldsNotImplemented = model?.fix?.fields?.field
      ?.map((f) => f['type'])
      .filter((f) => !parsers.includes(f) || !builders.includes(f));

    // If any required parses are not supported
    if (fieldsNotImplemented.length) {
      throw new Error(`Parsing`);
    }

    this.fixFieldInfoNumberDict = [];
    this.fixFieldInfoNameDict = [];
    this.fixMessageTypeDict = [];
    this.fixMessageNameDict = [];
    this.fixComponentsNameDict = [];

    let headers = model.fix.header.field;
    let trailers = model.fix.trailer.field;
    let fields = model.fix.fields.field;
    let messages = model.fix.messages.message;
    let components = model.fix.components.component;

    if (!Array.isArray(fields)) fields = [fields];
    if (!Array.isArray(messages)) messages = [messages];
    if (!Array.isArray(components)) components = [components];
    if (!Array.isArray(headers)) headers = [headers];
    if (!Array.isArray(trailers)) trailers = [trailers];

    fields.forEach((fieldInfo: FixFieldInfo) => {
      this.fixFieldInfoNumberDict[fieldInfo.number] = fieldInfo;
      this.fixFieldInfoNameDict[fieldInfo.name] = fieldInfo;
    });

    messages.forEach((message: FixMessage) => {
      this.fixMessageTypeDict[message.msgtype] = message;
      this.fixMessageNameDict[message.name] = message;
    });

    components.forEach((component: FixComponent) => {
      this.fixComponentsNameDict[component.name] = component;
    });

    this.fixHeader = {
      field: headers,
    };
    this.fixTrailer = {
      field: trailers,
    };

    const headerFields: FixFieldInfo[] = headers.map(
      (field: FixField) => this.fixFieldInfoNameDict[field.name],
    );

    const trailerFields: FixFieldInfo[] = trailers.map(
      (field: FixField) => this.fixFieldInfoNameDict[field.name],
    );

    this.headerFieldsNumbers = headerFields.map((field) => field.number);
    this.trailerFieldsNumbers = trailerFields.map((field) => field.number);
  }

  parse(fixMessage: string): FixDecodedMessage {
    const tokens: FixToken[] = fixMessage
      .split('|')
      .filter((token) => token.length)
      .map((token) => {
        const parts = token.split('=');
        return {
          tag: parts[0],
          value: parts[1],
        };
      });

    const message = this.getFixMessage(tokens);
    const missing = this.checkRequiredFields(message);

    if (missing.length) {
      throw new Error(`Missing required fields\n${missing.join('\n')}`);
    }

    return message;
  }

  private getNormalizedStruture(
    fixStructure: FixStructure,
  ): FixNormalizedStructure {
    const result: FixNormalizedStructure = { field: null };

    Object.assign(result, fixStructure);

    let fields: FixField[] = [];
    if (fixStructure.field) {
      if (Array.isArray(fixStructure.field)) {
        fields = fixStructure.field;
      } else {
        const field: FixField = fixStructure.field;
        fields = [field];
      }
    }

    let groups: FixGroup[] = [];
    if (fixStructure.group) {
      if (Array.isArray(fixStructure.group)) {
        groups = fixStructure.group;
      } else {
        const group: FixGroup = fixStructure.group;
        groups = [group];
      }
    }

    let components: FixComponent[] = [];
    if (fixStructure.component) {
      if (Array.isArray(fixStructure.component)) {
        components = fixStructure.component;
      } else {
        const component: FixComponent = fixStructure.component;
        components = [component];
      }
    }

    delete result.field;
    delete result.component;
    delete result.group;

    if (fields.length) result.field = fields;
    if (groups.length) result.group = groups;
    if (components.length) result.component = components;

    return result;
  }

  private getValue(token: FixToken): Value {
    const field = this.fixFieldInfoNumberDict[token.tag];
    if (!field) {
      throw new Error('Field tag not found');
    }
    return {
      [field.name]: fixFieldParsers[field.type](token.value),
    };
  }

  private getStructureValue(fixStructure: FixStructure, tokens: FixToken[]) {
    const normalized = this.getNormalizedStruture(fixStructure);
    const fieldNames = normalized.field.map((field) => field.name);
    const groupNames = normalized.group?.map((group) => group.name);
    const componentNames = normalized.component?.map(
      (component) => component.name,
    );

    const message = {};

    while (tokens.length) {
      const token = tokens.shift();

      if (!this.fixFieldInfoNumberDict[token.tag]) {
        throw new Error(`Tag not found: ${token.tag}`);
      }

      const tokenName = this.fixFieldInfoNumberDict[token.tag].name;
      const value = this.getValue(token);

      if (fieldNames.includes(tokenName)) {
        if (Object.keys(message).includes(tokenName)) {
          tokens.unshift(token);
          break;
        }
        Object.assign(message, value);
      } else if (groupNames.includes(tokenName)) {
        const group = normalized.group.find(
          (group: FixGroup) => group.name === tokenName,
        );
        const numberOfGroups = value[tokenName];
        message[tokenName] = [];

        for (let j = 0; j < numberOfGroups; j++) {
          const groupValues = this.getStructureValue(group, tokens);
          message[tokenName].push(groupValues);
        }

        if (message[tokenName].length !== numberOfGroups) {
          throw new Error(
            `Expected ${numberOfGroups} on group ${tokenName} but received ${message[tokenName].length}`,
          );
        }
      } else if (componentNames.includes(tokenName)) {
        throw new Error(`I do not know how to parse ${tokenName} compoment`);
      } else {
        throw new Error(`Unexpected ${tokenName}`);
      }
    }

    return message;
  }

  private getFixMessage(tokens: FixToken[]): FixDecodedMessage {
    const headerTokens = tokens.filter((token) =>
      this.headerFieldsNumbers.includes(token.tag),
    );
    const trailerTokens = tokens.filter((token) =>
      this.trailerFieldsNumbers.includes(token.tag),
    );
    const messageTokens = tokens.filter(
      (token) =>
        !headerTokens.includes(token) && !trailerTokens.includes(token),
    );

    const header = headerTokens
      .map((token) => this.getValue(token))
      .reduce((header, value) => Object.assign(header, value), {});

    const trailer = trailerTokens
      .map((token) => this.getValue(token))
      .reduce((header, value) => Object.assign(header, value), {});

    const body = this.getStructureValue(
      this.fixMessageTypeDict[header.MsgType],
      messageTokens,
    );

    return {
      Name: this.fixMessageTypeDict[header.MsgType].name,
      Header: header,
      Trailer: trailer,
      Body: body,
    };
  }

  checkRequiredFields(message: FixDecodedMessage): string[] {
    const fixMessage = this.fixMessageNameDict[message.Name];

    if (!fixMessage) {
      throw new Error(`Message name not found`);
    }
    return [
      ...this.checkRequired(this.fixHeader, message.Header),
      ...this.checkRequired(fixMessage, message.Body),
      ...this.checkRequired(this.fixTrailer, message.Trailer),
    ];
  }

  private checkRequired(
    fixStructure: FixStructure,
    body: FixDecoded,
  ): string[] {
    const normalized = this.getNormalizedStruture(fixStructure);
    const requiredFieldNames = normalized.field
      .filter((field) => field.required === 'Y')
      .map((field) => field.name);

    const bodyFieldNames = Object.keys(body);

    const missingRequired = requiredFieldNames.filter(
      (fieldName) => !bodyFieldNames.includes(fieldName),
    );

    if (normalized.component) {
      throw new Error('Not implmented');
    }

    if (normalized.group) {
      normalized.group.reduce((result, group) => {
        return [...result, ...this.checkRequired(group, body[group.name])];
      }, missingRequired);
    }

    return missingRequired;
  }

  build(message: FixDecodedMessage): string {
    const fixMessage = this.fixMessageNameDict[message.Name];

    if (!fixMessage) {
      throw new Error(`Message name not found`);
    }

    return (
      this.buildMessage(this.fixHeader, message.Header) +
      this.buildMessage(fixMessage, message.Body) +
      this.buildMessage(this.fixTrailer, message.Trailer)
    );
  }

  private buildMessage(fixStructure: FixStructure, body: FixDecoded): string {
    const normalized = this.getNormalizedStruture(fixStructure);
    const fieldNames = normalized.field.map((field) => field.name);
    const groupNames = normalized.group?.map((group) => group.name);
    const componentNames = normalized.component?.map(
      (component) => component.name,
    );

    let result = '';
    Object.keys(body).forEach((key) => {
      const field = this.fixFieldInfoNameDict[key];

      if (!field) {
        throw new Error(`Model field not found for key ${key}`);
      }

      if (fieldNames.includes(key)) {
        const builder = fixFieldBuilders[field.type];
        const tokenValue = builder(body[key]);
        result += `${field.number}=${tokenValue}|`;
      } else if (groupNames.includes(key)) {
        const group = normalized.group.find(
          (group: FixGroup) => group.name === key,
        );
        const numberOfGroups = body[key].length;

        result += `${field.number}=${body[key].length}|`;

        for (let j = 0; j < numberOfGroups; j++) {
          result += this.buildMessage(group, body[key][j]);
        }
      } else if (componentNames.includes(key)) {
        throw new Error(`I do not know how to build ${key} compoment`);
      } else {
        throw new Error(`Unexpected ${key}`);
      }
    });

    return result;
  }
}
