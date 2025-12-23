// Form Validation Utilities
export const validators = {
  // Email validation
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) return 'Email is required';
    if (!emailRegex.test(value)) return 'Invalid email format';
    return '';
  },

  // Password validation
  password: (value, minLength = 6) => {
    if (!value) return 'Password is required';
    if (value.length < minLength) return `Password must be at least ${minLength} characters`;
    return '';
  },

  // Strong password validation
  strongPassword: (value) => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
    return '';
  },

  // Phone validation
  phone: (value) => {
    const phoneRegex = /^[0-9]{10}$/;
    if (!value) return 'Phone number is required';
    if (!phoneRegex.test(value.replace(/[\s-]/g, ''))) return 'Invalid phone number (10 digits required)';
    return '';
  },

  // Required field
  required: (value, fieldName = 'This field') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return '';
  },

  // Minimum length
  minLength: (value, min, fieldName = 'This field') => {
    if (!value) return `${fieldName} is required`;
    if (value.length < min) return `${fieldName} must be at least ${min} characters`;
    return '';
  },

  // Maximum length
  maxLength: (value, max, fieldName = 'This field') => {
    if (value && value.length > max) return `${fieldName} must not exceed ${max} characters`;
    return '';
  },

  // Number validation
  number: (value, fieldName = 'This field') => {
    if (!value && value !== 0) return `${fieldName} is required`;
    if (isNaN(value)) return `${fieldName} must be a number`;
    return '';
  },

  // Positive number
  positiveNumber: (value, fieldName = 'This field') => {
    const numError = validators.number(value, fieldName);
    if (numError) return numError;
    if (parseFloat(value) <= 0) return `${fieldName} must be greater than 0`;
    return '';
  },

  // URL validation
  url: (value, fieldName = 'URL') => {
    if (!value) return `${fieldName} is required`;
    try {
      new URL(value);
      return '';
    } catch {
      return `Invalid ${fieldName} format`;
    }
  },

  // Match validation (for password confirmation)
  match: (value, matchValue, fieldName = 'This field', matchFieldName = 'the other field') => {
    if (!value) return `${fieldName} is required`;
    if (value !== matchValue) return `${fieldName} must match ${matchFieldName}`;
    return '';
  },

  // Pincode validation (Indian)
  pincode: (value) => {
    const pincodeRegex = /^[0-9]{6}$/;
    if (!value) return 'Pincode is required';
    if (!pincodeRegex.test(value)) return 'Invalid pincode (6 digits required)';
    return '';
  },
};

// Validate entire form
export function validateForm(formData, rules) {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const rule = rules[field];
    const value = formData[field];
    
    if (Array.isArray(rule)) {
      // Multiple validators
      for (const validator of rule) {
        const error = validator(value);
        if (error) {
          errors[field] = error;
          break;
        }
      }
    } else {
      // Single validator
      const error = rule(value);
      if (error) {
        errors[field] = error;
      }
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Custom hook for form validation
export function useFormValidation(initialValues, validationRules) {
  const [values, setValues] = React.useState(initialValues);
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});

  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate on blur
    if (validationRules[name]) {
      const rule = validationRules[name];
      const value = values[name];
      
      let error = '';
      if (Array.isArray(rule)) {
        for (const validator of rule) {
          error = validator(value);
          if (error) break;
        }
      } else {
        error = rule(value);
      }
      
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const validate = () => {
    const result = validateForm(values, validationRules);
    setErrors(result.errors);
    
    // Mark all fields as touched
    const allTouched = {};
    Object.keys(validationRules).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);
    
    return result.isValid;
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
    reset,
    setValues,
  };
}
