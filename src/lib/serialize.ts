export function toPlain<T extends { _id: { toString(): string } }>(doc: T) {
  const { _id, ...rest } = doc;
  return {
    ...rest,
    id: _id.toString(),
  };
}

export function toPlainList<T extends { _id: { toString(): string } }>(
  docs: T[],
) {
  return docs.map((doc) => toPlain(doc));
}
