import React, { createContext, useEffect, useState } from 'react';
import API from '../api/axios';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(() => {
		try {
			return JSON.parse(localStorage.getItem('user')) || null;
		} catch {
			return null;
		}
	});
	const [token, setToken] = useState(() => localStorage.getItem('token') || null);

	useEffect(() => {
		if (token) localStorage.setItem('token', token); else localStorage.removeItem('token');
		if (user) localStorage.setItem('user', JSON.stringify(user)); else localStorage.removeItem('user');
	}, [user, token]);

	const setAuth = (userData, jwt) => {
		setUser(userData || null);
		setToken(jwt || null);
	};

	const logout = () => {
		setUser(null);
		setToken(null);
		localStorage.removeItem('token');
		localStorage.removeItem('user');
	};

	return (
		<AuthContext.Provider value={{ user, token, setAuth, logout, API }}>
			{children}
		</AuthContext.Provider>
	);
};
