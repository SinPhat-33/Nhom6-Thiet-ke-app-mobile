import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SIZES, FONT_SIZES, FONT_WEIGHTS } from '../../theme';

const CustomInput = ({
  id,
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = 'default',
  iconName,
  error,
  autoCapitalize = 'none',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      
      <View style={[
        styles.inputWrapper, 
        isFocused && styles.inputFocused, 
        error && styles.inputError
      ]}>
        {iconName ? <Text style={styles.icon}>{iconName}</Text> : null}
        
        <TextInput
          key={id}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete="off"
          importantForAutofill="no"
          autoCorrect={false}
          spellCheck={false}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={COLORS.primary}
        />

        {secureTextEntry && (
          <TouchableOpacity 
            onPress={() => setIsPasswordVisible(!isPasswordVisible)} 
            style={styles.eyeButton}
            activeOpacity={0.7}
          >
            <Text style={styles.eyeIcon}>{isPasswordVisible ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: '#64748B',
    marginBottom: SPACING.xs,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F3F5',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    height: SIZES.inputHeight,
    paddingHorizontal: SPACING.md,
  },
  inputFocused: {
    borderColor: '#4F46E5',
    backgroundColor: '#FFFFFF',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  icon: {
    fontSize: 18,
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    color: '#1E293B',
    fontSize: FONT_SIZES.md,
    paddingVertical: 0,
  },
  eyeButton: {
    padding: SPACING.xs,
  },
  eyeIcon: {
    fontSize: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: FONT_SIZES.xs,
    marginTop: 4,
  },
});

export default CustomInput;
