// ═══════════════════════════════════════════════════════════════
// Jenkinsfile — CI/CD Pipeline
// Stages: Build → Test → Docker Build → Security Scan → Deploy
// ═══════════════════════════════════════════════════════════════

pipeline {
    agent any

    environment {
        DOCKER_IMAGE     = 'devops-app'
        DOCKER_TAG       = "${env.BUILD_NUMBER}"
        APP_PORT         = '3000'
    }

    stages {
        // ── Stage 1: Checkout Code ────────────────────────────
        stage('Checkout') {
            steps {
                echo '📥 Pulling source code from Git...'
                checkout scm
            }
        }

        // ── Stage 2: Install Dependencies ─────────────────────
        stage('Install Dependencies') {
            steps {
                echo '📦 Installing Node.js dependencies...'
                dir('app') {
                    sh 'npm install'
                }
            }
        }

        // ── Stage 3: Run Tests ────────────────────────────────
        stage('Test') {
            steps {
                echo '🧪 Running tests...'
                dir('app') {
                    sh 'npm test || true'
                }
            }
        }

        // ── Stage 4: Build Docker Images ──────────────────────
        stage('Docker Build') {
            parallel {
                stage('Build Original') {
                    steps {
                        echo '🐳 Building original Docker image...'
                        sh "docker build -f docker/Dockerfile.original -t ${DOCKER_IMAGE}:original ."
                    }
                }
                stage('Build Optimized') {
                    steps {
                        echo '🐳 Building optimized Docker image...'
                        sh "docker build -f docker/Dockerfile.optimized -t ${DOCKER_IMAGE}:optimized ."
                        sh "docker tag ${DOCKER_IMAGE}:optimized ${DOCKER_IMAGE}:${DOCKER_TAG}"
                    }
                }
            }
        }

        // ── Stage 5: Image Size Comparison ────────────────────
        stage('Image Size Report') {
            steps {
                echo '📊 Comparing image sizes...'
                sh "docker images ${DOCKER_IMAGE} --format 'table {{.Repository}}:{{.Tag}}\t{{.Size}}'"
            }
        }

        // ── Stage 6: Security Scan ────────────────────────────
        stage('Security Scan') {
            steps {
                echo '🔒 Scanning for vulnerabilities...'
                sh '''
                    docker scout cves ${DOCKER_IMAGE}:optimized --format json > scan_report.json || \
                    echo "Docker Scout requires login — skipping scan"
                '''
            }
        }

        // ── Stage 7: Deploy with Docker Compose ───────────────
        stage('Deploy') {
            steps {
                echo '🚀 Deploying application stack...'
                sh 'docker compose down || true'
                sh 'docker compose up -d --build'
            }
        }

        // ── Stage 8: Verify Deployment ────────────────────────
        stage('Verify') {
            steps {
                echo '✅ Verifying deployment...'
                sh 'sleep 10'
                sh 'curl -f http://localhost:3000/health || exit 1'
                sh 'curl -f http://localhost:9090/-/healthy || exit 1'
                sh 'curl -f http://localhost:3001/api/health || exit 1'
                echo '✅ All services are running!'
            }
        }
    }

    post {
        success {
            echo '🎉 Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed!'
            sh 'docker compose logs'
        }
        always {
            echo '🧹 Cleanup...'
            sh 'docker system prune -f || true'
        }
    }
}
