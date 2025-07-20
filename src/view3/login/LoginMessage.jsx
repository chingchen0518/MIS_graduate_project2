import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const LoginMessage = ({ error, success }) => (
    <>
        {success && (
            <div className="message success">
                <FontAwesomeIcon icon={faCheckCircle} />
                <span>{success}</span>
            </div>
        )}
        {error && (
            <div className="message error">
                <FontAwesomeIcon icon={faExclamationTriangle} />
                <span>{error}</span>
            </div>
        )}
    </>
);

export default LoginMessage;
