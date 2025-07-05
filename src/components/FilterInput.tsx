import React from 'react';
import { Box, Text } from 'ink';

interface FilterInputProps {
  filter: string;
  onFilterChange: (filter: string) => void;
}

export function FilterInput({ filter, onFilterChange }: FilterInputProps) {
  return (
    <Box borderStyle="single" borderColor="gray" padding={1}>
      <Text color="gray">Filter: </Text>
      <Text color="white">{filter || '(empty)'}</Text>
    </Box>
  );
}