import React from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook } from "@fortawesome/free-brands-svg-icons";
import { faInstagram } from "@fortawesome/free-brands-svg-icons";
import { faXTwitter } from "@fortawesome/free-brands-svg-icons";

export default function Footer() {
    const navigate = useNavigate();

    return (
        <footer className="bg-blue-950 text-white mt-20 sm:mt-30 shadow-inner shadow-gray-200">
            <div className="max-w-5xl mx-auto px-13 py-11">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-22 mb-8">

                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-3xl">MASS</h3>
                        </div>
                        <p className="text-gray-400 leading-relaxed text-[19px]">
                            MiniSupermercado y ya.
                        </p>
                    </div>

                    <div className="justify-end">
                        <h4 className="font-bold text-lg mb-4">Síguenos</h4>
                        <div className="flex gap-4 mb-6">
                            <button className="bg-gray-600 hover:bg-blue-600 p-3 rounded-full transition duration-300">
                                <FontAwesomeIcon
                                    icon={faFacebook}
                                    className="w-6 h-5 filter brightness-0 invert"
                                />
                            </button>
                            <button className="bg-gray-600 hover:bg-black p-3 rounded-full transition duration-300">
                                <FontAwesomeIcon
                                    icon={faXTwitter}
                                    className="w-6 h-5 filter brightness-0 invert"
                                />
                            </button>
                            <button className="bg-gray-600 hover:bg-pink-600 p-3 rounded-full transition duration-300">
                                <FontAwesomeIcon
                                    icon={faInstagram}
                                    className="w-6 h-5 filter brightness-0 invert"
                                />
                            </button>
                        </div>
                        <p className="text-gray-400 text-sm">
                            📧 supermass@gmail.com
                        </p>
                    </div>
                </div>

                <div className="border-t border-gray-700 pt-6">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <p className="text-gray-400 text-sm mb-4 md:mb-0">
                            © 2024 Mass. Todos los derechos reservados.
                        </p>
                        <div className="flex gap-6 text-gray-400 text-sm">
                            <button
                                onClick={() => navigate("/privacy")}
                                className="hover:text-purple-400 transition duration-300"
                            >
                                Política de Privacidad
                            </button>
                            <button
                                onClick={() => navigate("/terms")}
                                className="hover:text-purple-400 transition duration-300"
                            >
                                Términos de Servicio
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-1 bg-gradient-to-r from-yellow-400 to-orange-600"></div>
        </footer>
    );
}