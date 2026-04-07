import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';

export default function Register(){
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState(null);
	const navigate = useNavigate();
	const { setAuth } = useContext(AuthContext);

	const submit = async (e) => {
		e.preventDefault();
		setError(null);
		try{
			const res = await API.post('/auth/register', { name, email, password });
			const { user, token } = res.data;
			if (token) {
				setAuth(user, token);
				return navigate('/');
			}
			navigate('/login');
		}catch(err){
			setError(err.response?.data?.message || 'Registration failed');
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<form onSubmit={submit} className="w-full max-w-sm bg-white p-6 rounded shadow">
				<h1 className="text-lg font-semibold mb-4">Register</h1>
				{error && <div className="text-red-500 text-sm mb-2">{error}</div>}
				<input className="input mb-2" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
				<input className="input mb-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
				<input className="input mb-4" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
				<button className="w-full bg-green-600 text-white py-2 rounded">Create account</button>
			</form>
		</div>
	);
}
