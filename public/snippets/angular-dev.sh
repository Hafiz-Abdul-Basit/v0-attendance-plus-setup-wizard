#!/bin/bash

# Angular Development Environment Setup
# This script sets up the Angular development environment for AttendancePlus

echo "Setting up Angular Development Environment..."

# Install Node.js dependencies
npm install

# Install Angular CLI globally
npm install -g @angular/cli@latest

# Install project dependencies
npm install @angular/material @angular/cdk @angular/animations
npm install @angular/flex-layout
npm install rxjs
npm install moment

# Development server commands
echo "Available commands:"
echo "npm start - Start development server"
echo "ng build - Build for production"
echo "ng test - Run unit tests"
echo "ng e2e - Run end-to-end tests"

# Start development server
echo "Starting development server..."
ng serve --host 0.0.0.0 --port 4200
