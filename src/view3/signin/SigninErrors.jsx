import React from 'react';

const SigninErrors = ({ errors }) => (
    errors.length > 0 && (
        <div className="error-message">
            <ul>
                {errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                ))}
            </ul>
        </div>
    )
);

export default SigninErrors;
