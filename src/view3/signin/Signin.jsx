import React, { useState } from "react";
import './signin.css';
import FloatingShapes from './FloatingShapes';
import SigninHeader from './SigninHeader';
import SigninForm from './SigninForm';
import SigninFooter from './SigninFooter';
import SigninErrors from './SigninErrors';

const initialState = {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    role: "delivery",
    healthGoal: "",
};

function Signin() {
    const [form, setForm] = useState(initialState);
    const [errors, setErrors] = useState([]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        const errs = [];
        if (!form.name.trim()) errs.push("姓名不能為空");
        if (!form.email.trim()) errs.push("電子郵件不能為空");
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.push("請輸入有效的電子郵件地址");
        if (!form.password) errs.push("密碼不能為空");
        else if (form.password.length < 6) errs.push("密碼必須至少6個字符");
        if (form.password !== form.confirmPassword) errs.push("兩次輸入的密碼不一致");
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        setErrors(errs);
        if (errs.length === 0) {
            alert("註冊成功（模擬）");
            setForm(initialState);
        }
    };

    return (
        <div className="page">
            <FloatingShapes />
            <div className="container">
                <SigninHeader />
                <div className="body">
                    <SigninErrors errors={errors} />
                    <SigninForm
                        form={form}
                        handleChange={handleChange}
                        handleSubmit={handleSubmit}
                    />
                </div>
                <SigninFooter />
            </div>
        </div>
    );
}

export default Signin;
