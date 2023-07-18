export const chunkArray = <T>(items: Array<T>, chunkSize: number): Array<Array<T>> => {
  const totalChunks = Math.ceil(items.length / chunkSize);

  const chunks = new Array<Array<T>>(totalChunks);
  for (let i = 0; i < totalChunks; i += 1) {
    chunks[i] = items.slice(i * chunkSize, (i + 1) * chunkSize);
  }

  return chunks;
};

export const deduplicate = <T>(items: Array<T>): Array<T> => {
  return [...new Set(items)];
};

export const filterDefined = <T>(items: Array<T>): Array<NonNullable<T>> => {
  return items.filter((v) => v !== undefined && v !== null) as Array<NonNullable<T>>;
};
