import React from 'react';
import { View, Text } from 'react-native';

export const Avatar: React.FC<{ name: string; size?: number }> = ({ name, size = 64 }) => {
  const getHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const hash = getHash(name);
  const hue = hash % 360;
  const saturation = 60 + (hash % 30);
  const brightness = 50 + (hash % 20);
  const isCircle = hash % 3 === 1;

  return (
    <View
      className="items-center justify-center border border-white/10 overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: isCircle ? size / 2 : 16,
        backgroundColor: `hsl(${hue}, ${saturation}%, ${brightness}%)`,
      }}
    >
      <Text className="text-white font-black" style={{ fontSize: size * 0.35 }}>
        {name.substring(0, 2).toUpperCase()}
      </Text>
    </View>
  );
};
