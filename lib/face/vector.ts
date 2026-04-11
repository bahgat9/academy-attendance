export function descriptorToVectorLiteral(descriptor: number[]) {
  return `[${descriptor.join(",")}]`;
}