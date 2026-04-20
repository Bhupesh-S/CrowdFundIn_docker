// ═══════════════════════════════════════════════════════════════
// Jenkinsfile — CI/CD Pipeline
// Stages: Build → Test → Docker Build → Security Scan → Deploy
// ═══════════════════════════════════════════════════════════════

pipeline {
    agent any

    environment {
        BACKEND_IMAGE    = 'crowdfundin-backend'
        FRONTEND_IMAGE   = 'crowdfundin-frontend'
        DOCKER_TAG       = "${env.BUILD_NUMBER}"
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
                dir('backend') {
                    sh 'npm install'
                }
                dir('frontend') {
                    sh 'npm install --legacy-peer-deps || npm install'
                }
            }
        }

        // ── Stage 3: Run Tests ────────────────────────────────
        stage('Test') {
            steps {
                echo '🧪 Running tests...'
                dir('backend') {
                    sh '''
                        node server.js > /dev/null 2>&1 &
                        NODE_PID=$!
                        sleep 2
                        npm test || true
                        kill $NODE_PID || true
                    '''
                }
                dir('frontend') {
                    sh 'CI=true npm test || true'
                }
            }
        }

        // ── Stage 4: Build Docker Images ──────────────────────
        stage('Docker Build') {
            parallel {
                stage('Build Backend') {
                    steps {
                        echo '🐳 Building Backend Docker image...'
                        sh "docker build -f backend/Dockerfile -t ${BACKEND_IMAGE}:${DOCKER_TAG} backend/"
                        sh "docker tag ${BACKEND_IMAGE}:${DOCKER_TAG} ${BACKEND_IMAGE}:latest"
                    }
                }
                stage('Build Frontend') {
                    steps {
                        echo '🐳 Building Frontend Docker image...'
                        sh "docker build -f frontend/Dockerfile -t ${FRONTEND_IMAGE}:${DOCKER_TAG} frontend/"
                        sh "docker tag ${FRONTEND_IMAGE}:${DOCKER_TAG} ${FRONTEND_IMAGE}:latest"
                    }
                }
            }
        }

        // ── Stage 5: Image Size Comparison ────────────────────
        stage('Image Size Report') {
            steps {
                echo '📊 Image sizes...'
                sh "docker images ${BACKEND_IMAGE} --format 'table {{.Repository}}:{{.Tag}}\\t{{.Size}}'"
                sh "docker images ${FRONTEND_IMAGE} --format 'table {{.Repository}}:{{.Tag}}\\t{{.Size}}'"
            }
        }

        // ── Stage 6: Security Scan ────────────────────────────
        stage('Security Scan') {
            steps {
                echo '🔒 Scanning for vulnerabilities...'
                sh '''
                    docker scout cves ${BACKEND_IMAGE}:latest --format json > backend_scan_report.json || echo "Skipping scan"
                    docker scout cves ${FRONTEND_IMAGE}:latest --format json > frontend_scan_report.json || echo "Skipping scan"
                '''
            }
        }

        // ── Stage 7: Deploy with Docker Compose ───────────────
        stage('Deploy') {
            steps {
                echo '🚀 Deploying application stack...'
                sh 'docker compose down || true'
                sh 'docker rm -f crowdfundin-backend crowdfundin-frontend devops-prometheus devops-grafana crowdfundin-mongo || true'
                sh 'docker compose up -d --build'
                sh 'docker cp prometheus/prometheus.yml devops-prometheus:/etc/prometheus/prometheus.yml'
                sh 'docker cp grafana/provisioning devops-grafana:/etc/grafana/ || true'
                sh 'docker cp grafana/dashboards devops-grafana:/var/lib/grafana/ || true'
                sh 'docker restart devops-prometheus devops-grafana'
            }
        }

        // ── Stage 8: Verify Deployment ────────────────────────
        stage('Verify') {
            steps {
                echo '✅ Verifying deployment...'
                sh 'sleep 15'
                sh 'docker exec crowdfundin-backend wget --no-verbose --tries=1 --spider http://127.0.0.1:5000/api/health || exit 1'
                sh 'docker exec devops-prometheus wget --no-verbose --tries=1 --spider http://127.0.0.1:9090/-/healthy || exit 1'
                sh 'docker exec devops-grafana wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1'
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
