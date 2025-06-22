'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Bot, BarChart3, Sparkles, ArrowRight, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative">
        <div className="pt-6 pb-16 sm:pb-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mt-16 mx-auto max-w-7xl px-4 sm:mt-24 sm:px-6"
          >
            <div className="text-center">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">IntelAI</span>
                <span className="block text-blue-600">Competitive Intelligence</span>
              </h1>
              <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                AI-powered assistant that crawls competitor websites, extracts key updates, synthesizes insights, and generates strategic briefs to keep you ahead of the competition.
              </p>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8 gap-4"
              >
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-xl shadow-lg"
                >
                  <Link
                    href="/signup"
                    className="w-full flex items-center justify-center gap-2 px-8 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 md:py-4 md:text-lg md:px-10"
                  >
                    <Sparkles className="w-5 h-5" />
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-3 rounded-xl shadow-lg sm:mt-0"
                >
                  <Link
                    href="/login"
                    className="w-full flex items-center justify-center gap-2 px-8 py-3 border border-transparent text-base font-medium rounded-xl text-blue-600 bg-white/80 backdrop-blur-sm hover:bg-white shadow-lg hover:shadow-xl transition-all duration-200 md:py-4 md:text-lg md:px-10"
                  >
                    <Zap className="w-5 h-5" />
                    Sign In
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Features Section */}
        <div className="py-12 bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="lg:text-center"
            >
              <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Features</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Everything you need for competitive intelligence
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="mt-10"
            >
              <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05 }}
                  className="relative group"
                >
                  <motion.div 
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="absolute flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg group-hover:shadow-xl transition-shadow duration-200"
                  >
                    <Search className="w-6 h-6" />
                  </motion.div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Automated Crawling</p>
                  <p className="mt-2 ml-16 text-base text-gray-500">
                    Automatically monitor competitor websites and extract key information.
                  </p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05 }}
                  className="relative group"
                >
                  <motion.div 
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="absolute flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg group-hover:shadow-xl transition-shadow duration-200"
                  >
                    <Bot className="w-6 h-6" />
                  </motion.div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">AI-Powered Analysis</p>
                  <p className="mt-2 ml-16 text-base text-gray-500">
                    Generate intelligent insights from competitor data using advanced AI.
                  </p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05 }}
                  className="relative group"
                >
                  <motion.div 
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="absolute flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg group-hover:shadow-xl transition-shadow duration-200"
                  >
                    <BarChart3 className="w-6 h-6" />
                  </motion.div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Strategic Reports</p>
                  <p className="mt-2 ml-16 text-base text-gray-500">
                    Get comprehensive reports and actionable competitive intelligence.
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
} 