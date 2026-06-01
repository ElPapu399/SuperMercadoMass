import React, { useState } from "react";
import Footer from "../components/Footer";
import logoMass from "../assets/massLogo.png"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import '../index.css'

export default function HomeLogin() {

    const [usuario, setUsuario] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // const {login: authLogin} = useAuth();

    const handleSubmit = async(e: React.FormEvent) => {
        e.preventDefault();

        setError("");

        if(!usuario || !password) {
            setError("Por favor, complete todos los campos");
            return;
        }

        try {
            setLoading(true);

            await new Promise(resolve => setTimeout(resolve, 1000));

            if(usuario !== "admin" || password !== "1234") {
                throw new Error("Creedenciales inválidas");
            }
            console.log("Login correcto");
        } catch (err) {
            setError("Usuario o contraseña incorrectas");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-200 to-orange-400">
            <section className="min-h-[90vh] flex flex-col md:flex-row items-center justify-center px-6 gap-16">
                <div className="absolute top-0.5 left-1/2 -translate-x-1/2">
                    <img
                        src={logoMass}
                        alt="Logo MASS"
                        className="w-60 h-auto"
                    />
                </div>
                <div className="text-left max-w-2xl">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-gray-800 mb-6 leading-tight">
                        Inventory Control
                    </h1>
                    <p className="text-4xl text-lg text-gray-700">
                        Optimizar el control de inventario, supervisa existencias en tiempo real
                        y gestiona eficientemente los productos.
                    </p>
                </div>

                <div className="text-left bg-gray-200 p-8 rounded-2xl shadow-2xl w-full max-w-md">
                    <h2 className="text-2xl text-black font-bold text-center mb-6">Iniciar Sesión</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Usuario
                            </label>
                            <input
                                type="text"
                                value={usuario}
                                onChange={(e) => setUsuario(e.target.value)}
                                placeholder="Ingrese su usuario"
                                className="w-full border bg-white border-gray-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Ingrese su contraseña"
                                    className="w-full border bg-white border-gray-500 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-orange-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
                                >
                                    <FontAwesomeIcon
                                        icon={showPassword ? faEyeSlash: faEye}
                                    />
                                </button>
                            </div>
                        </div>
                        {error && (
                            <div className="text-red-700 px-2 py-1 rounded-lg text-sm">
                                {error}
                            </div>
                        )}
                        <button
                            // onClick={() => navigate("/homeInventario")}
                            type="submit"
                            disabled={loading}
                            className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 hover:scale-105 transition-all duration-300 disabled:opacity-50"
                        >
                            {loading ? "Validando..." : "INGRESAR"}
                        </button>
                    </form>
                </div>
            </section>
            <div className="flex justify-center animate-bounce -mt-40">
                <div className="text-gray-600 text-8xl">↓</div>
            </div>
            <Footer/>
        </div>
    )
}