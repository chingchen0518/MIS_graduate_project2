import React, { useState } from "react";
import './backend.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faCalendarAlt, faClock, faMapMarkerAlt, faEdit } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from "react-router-dom";

let HOST_URL = import.meta.env.VITE_API_URL;
let NGROK_URL = import.meta.env.VITE_NGROK_URL;

const PORT = import.meta.env.PORT || 3001;

let BASE_URL = NGROK_URL|| `http://${HOST_URL}:${PORT}`;

const initialState = {
    title: "",
    country: "",
    s_date: "",
    e_date: "",
    s_time: "",
    e_time: "",
    time: "", // 預設值
};

function Backend() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    const [form, setForm] = useState(initialState);
    const [errors, setErrors] = useState([]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        const errs = [];
        if (!form.title.trim()) errs.push("Trip title cannot be empty");
        if (!form.country.trim()) errs.push("Country cannot be empty");
        if (!form.s_date) errs.push("Arrival date cannot be empty");
        if (!form.e_date) errs.push("Departure date cannot be empty");
        if (!form.s_time) errs.push("Arrival time cannot be empty");
        if (!form.e_time) errs.push("Departure time cannot be empty");
        if (!form.time) errs.push("Every stage time cannot be empty");
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        setErrors(errs);
        if (errs.length === 0) {
            try {
                // time 轉成 "HH:00:00"
                const hour = parseInt(form.time, 10) || 0;
                const formattedTime = `${hour.toString().padStart(2, '0')}:00:00`;

                // s_time, e_time 加上秒數
                const formatTimeWithSeconds = (t) => t && t.length === 5 ? `${t}:00` : t;
                const formatted_s_time = formatTimeWithSeconds(form.s_time);
                const formatted_e_time = formatTimeWithSeconds(form.e_time);

            const response = await fetch(`${BASE_URL}/api/trip-create`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true'
                    },
                    body: JSON.stringify({
                        title: form.title,
                        country: form.country,
                        s_date: form.s_date,
                        e_date: form.e_date,
                        s_time: formatted_s_time,
                        e_time: formatted_e_time,
                        time: formattedTime,
                        u_id: user?.uid
                    })
            });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('trip', JSON.stringify({
                        tid: data.tripId,
                        title: form.title
                    }));
                    alert('Trip created successfully!');
                    navigate('/Vistour');
                    setForm(initialState);
                    setErrors([]);
                    setErrors([data?.message || `Creation failed (Status Code: ${response.status})`]);
                }
            } catch (err) {
                setErrors([`An error occurred, please ensure the server is running. Error message: ${err.message}`]);
            }
        }
    };

    return (
        <div className="all_page">
            <div className="floating-shapes">
                <div className="shape" />
                <div className="shape" />
                <div className="shape" />
                <div className="shape" />
            </div>
            <div className="main_container">
                <div className="all_header">
                    <div className="all_logo">
                        <div className="all_logo-icon">
                            <FontAwesomeIcon icon={faGlobe} />
                        </div>
                        <h1 className="all_title">Vistour</h1>
                    </div>
                    <p className="all_subtitle">Fill in your trip information</p>
                </div>

                <div className="body">
                    {errors.length > 0 && (
                        <div className="error-message">
                            <ul>
                                {errors.map((err, idx) => (
                                    <li key={idx}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="all_form-group">
                            <label htmlFor="title">Trip Title</label>
                            <div className="all_input-with-icon">
                                <FontAwesomeIcon icon={faEdit} />
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    className="form-control"
                                    placeholder="Enter trip title"
                                    value={form.title}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="all_form-group">
                            <label htmlFor="country">Country</label>
                            <div className="all_input-with-icon">
                                <FontAwesomeIcon icon={faMapMarkerAlt} />
                                <input
                                    type="text"
                                    id="country"
                                    name="country"
                                    className="form-control"
                                    placeholder="Enter country"
                                    value={form.country}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="all_form-group">
                                <label htmlFor="s_date">Arrival Date</label>
                                <div className="all_input-with-icon">
                                    <FontAwesomeIcon icon={faCalendarAlt} />
                                    <input
                                        type="date"
                                        id="s_date"
                                        name="s_date"
                                        className="form-control"
                                        value={form.s_date}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="all_form-group">
                                <label htmlFor="s_time">Arrival Time</label>
                                <div className="all_input-with-icon">
                                    <FontAwesomeIcon icon={faClock} />
                                    <input
                                        type="time"
                                        id="s_time"
                                        name="s_time"
                                        className="form-control"
                                        value={form.s_time}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="all_form-group">
                                <label htmlFor="e_date">Departure Date</label>
                                <div className="all_input-with-icon">
                                    <FontAwesomeIcon icon={faCalendarAlt} />
                                    <input
                                        type="date"
                                        id="e_date"
                                        name="e_date"
                                        className="form-control"
                                        value={form.e_date}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="all_form-group">
                                <label htmlFor="e_time">Departure Time</label>
                                <div className="all_input-with-icon">
                                    <FontAwesomeIcon icon={faClock} />
                                    <input
                                        type="time"
                                        id="e_time"
                                        name="e_time"
                                        className="form-control"
                                        value={form.e_time}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="all_form-group">
                            <label htmlFor="time">Every Stage Time (hours)</label>
                            <div className="all_input-with-icon">
                                <FontAwesomeIcon icon={faClock} />
                                <input
                                    type="number"
                                    id="time"
                                    name="time"
                                    className="form-control"
                                    min="0"
                                    step="1" // 只能輸入整數
                                    placeholder="Enter hours (e.g. 2)"
                                    value={form.time}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="all_btn">Submit</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Backend;