pipeline {
    agent any

    triggers {
        pollSCM('* * * * *')
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
                        node -e "require('./package.json'); console.log('✅ Backend OK')"
                        node --check server.js && echo "✅ Backend syntax OK"
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

        stage('Prepare Environment') {
            steps {
                echo '⚙️ Preparing configs...'
                sh '''
                    # ── Prometheus config ──
                    rm -rf prometheus
                    mkdir -p prometheus

                    cat <<EOF > prometheus/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['crowdfundin-backend:5000']
EOF

                    # ── ENV FILE (CRITICAL FIX) ──
                    cat <<EOF > .env
MONGODB_URI=$MONGODB_URI
JWT_SECRET=$JWT_SECRET
RAZORPAY_KEY_ID=$RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET=$RAZORPAY_KEY_SECRET
EOF

                    echo "✅ Config + .env ready"
                '''
            }
        }

        stage('Deploy') {
            steps {
                echo '🚀 Deploying...'

                withCredentials([
                    string(credentialsId: 'mongo-uri', variable: 'MONGODB_URI'),
                    string(credentialsId: 'jwt-secret', variable: 'JWT_SECRET'),
                    string(credentialsId: 'razorpay-key-id', variable: 'RAZORPAY_KEY_ID'),
                    string(credentialsId: 'razorpay-key-secret', variable: 'RAZORPAY_KEY_SECRET')
                ]) {

                    sh '''
                        export MONGODB_URI
                        export JWT_SECRET
                        export RAZORPAY_KEY_ID
                        export RAZORPAY_KEY_SECRET

                        docker compose down --remove-orphans --volumes || true
                        docker rm -f crowdfundin-backend crowdfundin-frontend devops-prometheus devops-grafana || true

                        docker compose up -d
                    '''
                }
            }
        }

        stage('Verify') {
            steps {
                echo '🔍 Verifying backend...'

                sh '''
                    for i in $(seq 1 15); do
                        if docker exec crowdfundin-backend wget -q --spider http://127.0.0.1:5000/api/health; then
                            echo "✅ Backend healthy"
                            exit 0
                        fi
                        sleep 5
                    done

                    echo "❌ Backend failed"
                    exit 1
                '''
            }
        }
    }

    post {
        success {
            echo '🎉 SUCCESS'
        }
        failure {
            echo '❌ FAILED'
            sh 'docker compose logs --tail=50 || true'
        }
        always {
            sh 'docker image prune -f || true'
        }
    }
}