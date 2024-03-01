import * as parser from 'proto-parser';

const constructMessagesMap = (
  node: parser.ProtoRoot,
  // message_name -> field_name -> fields
  messagesMap: Map<string, Map<number, parser.FieldDefinition>>,
) => {
  for (const name in node.nested) {
    const message = node.nested[name];
    const fields = new Map<number, parser.FieldDefinition>();
    if (message.syntaxType === parser.SyntaxType.MessageDefinition) {
      for (const fieldName in (message as parser.MessageDefinition).fields) {
        const field = (message as parser.MessageDefinition).fields[fieldName];
        fields.set(field.id, field);
      }
      messagesMap.set(name, fields);
    }
  }
};

export const parseProtoFile = (protoFile: string) => {
  const ast = parser.parse(protoFile, { weakResolve: true });
  if (ast.syntaxType === parser.SyntaxType.ProtoError) {
    throw new Error(`Failed to parse proto file: ${ast.message}`);
  }
  return ast.root;
};

export const getProtoMessagesMap = (root: parser.ProtoRoot | null) => {
  if (!root) return null;
  const messagesMap = new Map<string, Map<number, parser.FieldDefinition>>();
  constructMessagesMap(root, messagesMap);
  return messagesMap;
};

export const getProtoEnumsMap = (root: parser.ProtoRoot | null) => {
  if (!root) return null;
  const enumsMap = new Map<string, Map<number, string>>();
  for (const name in root.nested) {
    const node = root.nested[name];
    if (node.syntaxType === parser.SyntaxType.EnumDefinition) {
      const map = new Map<number, string>();
      for (const key in (node as parser.EnumDefinition).values) {
        const value = (node as parser.EnumDefinition).values[key];
        map.set(value, key);
      }
      enumsMap.set(name, map);
    }
  }
  return enumsMap;
};

export const getField = (
  messagesMap: Map<string, Map<number, parser.FieldDefinition>>,
  fieldNumbers: number[],
  messageName: string,
) => {
  let result = messageName;
  for (let i = 0; i < fieldNumbers.length; i++) {
    const fieldNumber = fieldNumbers[i];
    const message = messagesMap.get(result);
    if (!message) return null;
    const field = message.get(fieldNumber);
    if (!field) return null;
    if (i === fieldNumbers.length - 1) return field;
    result = field.type.value;
  }
  return null;
};
