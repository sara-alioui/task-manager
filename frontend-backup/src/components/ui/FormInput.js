import React from 'react';

const FormInput = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  error, 
  ...props 
}) => {
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={onChange}
          {...props}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          {...props}
        />
      )}
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default FormInput;