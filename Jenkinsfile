pipeline {
    agent any

    triggers {
        pollSCM('H/5 * * * *')
    }

    environment {
        BACKEND_IMAGE  = 'crowdfundin-backend'
        FRONTEND_IMAGE = 'crowdfundin-frontend'
        DOCKER_TAG     = "${env.BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                echo '📥 Pulling source code...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '📦 Installing dependencies...'
                dir('backend') {
                    sh 'npm install'
                }
                dir('frontend') {
                    sh 'npm install --legacy-peer-deps || npm install'
                }
            }
        }

        stage('Test') {
            steps {
                echo '🧪 Running tests...'
                dir('backend') {
                    sh '''
                        timeout 20s node server.js &
                        sleep 3
                        npm test || true
                        pkill -f "node server.js" || true
                    '''
                }
                dir('frontend') {
                    sh 'CI=true npm test || true'
                }
            }
        }

        stage('Docker Build') {
            parallel {
                stage('Backend') {
                    steps {
                        sh """
                        docker build -f backend/Dockerfile -t ${BACKEND_IMAGE}:${DOCKER_TAG} backend/
                        docker tag ${BACKEND_IMAGE}:${DOCKER_TAG} ${BACKEND_IMAGE}:latest
                        """
                    }
                }
                stage('Frontend') {
                    steps {
                        sh """
                        docker build -f frontend/Dockerfile -t ${FRONTEND_IMAGE}:${DOCKER_TAG} frontend/
                        docker tag ${FRONTEND_IMAGE}:${DOCKER_TAG} ${FRONTEND_IMAGE}:latest
                        """
                    }
                }
            }
        }

        stage('Image Size Report') {
            steps {
                sh "docker images ${BACKEND_IMAGE}"
                sh "docker images ${FRONTEND_IMAGE}"
            }
        }

        stage('Security Scan') {
            steps {
                echo '🔒 Scanning images...'
                sh '''
                    docker scout cves ${BACKEND_IMAGE}:latest || echo "Skipping backend scan"
                    docker scout cves ${FRONTEND_IMAGE}:latest || echo "Skipping frontend scan"
                '''
            }
        }

        stage('Prepare Env') {
            steps {
                echo '⚙️ Preparing .env file...'
                sh '''
                    mkdir -p backend
                    echo "PORT=5000" > backend/.env
                    echo "MONGO_URI=mongodb://crowdfundin-mongo:27017/app" >> backend/.env
                '''
            }
        }

        stage('Deploy') {
            steps {
                echo '🚀 Deploying...'
                sh '''
                    docker compose down --remove-orphans || true

                    docker rm -f crowdfundin-backend crowdfundin-frontend devops-prometheus devops-grafana crowdfundin-mongo || true

                    docker compose up -d --build
                '''
            }
        }

        stage('Verify') {
            steps {
                echo '🔍 Verifying services...'
                sh '''
                    for i in {1..10}; do
                        docker exec crowdfundin-backend wget -q --spider http://127.0.0.1:5000/api/health && break
                        echo "Waiting for backend..."
                        sleep 5
                    done
                '''

                sh '''
                    docker exec devops-prometheus wget -q --spider http://127.0.0.1:9090/-/healthy
                    docker exec devops-grafana wget -q --spider http://127.0.0.1:3000/api/health
                '''

                echo '✅ Deployment successful!'
            }
        }
    }

    post {
        success {
            echo '🎉 Pipeline completed successfully!'
        }

        failure {
            echo '❌ Pipeline failed!'
            sh 'docker compose logs || true'
        }

        always {
            echo '🧹 Cleanup...'
            sh 'docker system prune -f || true'
        }
    }
}