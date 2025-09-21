#!/bin/bash
# scripts/run-deployment-test.sh

echo "🚀 CreatorBonds Deployment Test Runner"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "Checking project setup..."

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this from your project root."
    exit 1
fi

# Check if hardhat is installed
if [ ! -f "node_modules/.bin/hardhat" ]; then
    print_warning "Hardhat not found. Installing dependencies..."
    npm install
fi

# Check if contracts directory exists
if [ ! -d "contracts" ]; then
    print_error "contracts directory not found. Please ensure contracts are in place."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from template..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_warning "Please edit .env file with your actual values before proceeding."
        read -p "Press Enter when you've configured your .env file..."
    else
        print_error "No .env.example found. Please create .env file manually."
        exit 1
    fi
fi

print_status "Compiling contracts..."

# Compile contracts
if npx hardhat compile; then
    print_success "Contracts compiled successfully"
else
    print_error "Contract compilation failed"
    exit 1
fi

print_status "Running tests..."

# Run unit tests first
if npx hardhat test; then
    print_success "Unit tests passed"
else
    print_error "Unit tests failed"
    exit 1
fi

# Ask user which network to test on
echo ""
echo "Select network for deployment test:"
echo "1) Local Hardhat Network (Recommended for first test)"
echo "2) Sepolia Testnet (Requires test ETH)"
echo "3) Mumbai Testnet (Requires test MATIC)"

read -p "Enter choice (1-3): " network_choice

case $network_choice in
    1)
        NETWORK="localhost"
        print_status "Starting local Hardhat network..."
        
        # Start hardhat node in background
        npx hardhat node &
        NODE_PID=$!
        
        # Wait for node to start
        sleep 5
        
        print_status "Running deployment test on local network..."
        if npx hardhat run scripts/quickDeploymentTest.js --network localhost; then
            print_success "Local deployment test completed successfully!"
        else
            print_error "Local deployment test failed"
            kill $NODE_PID 2>/dev/null
            exit 1
        fi
        
        # Stop hardhat node
        kill $NODE_PID 2>/dev/null
        ;;
    2)
        NETWORK="sepolia"
        print_warning "Testing on Sepolia testnet requires test ETH"
        print_status "You can get test ETH from: https://sepoliafaucet.com/"
        read -p "Do you have test ETH and want to proceed? (y/N): " confirm
        
        if [[ $confirm =~ ^[Yy]$ ]]; then
            print_status "Running deployment test on Sepolia..."
            if npx hardhat run scripts/quickDeploymentTest.js --network sepolia; then
                print_success "Sepolia deployment test completed successfully!"
            else
                print_error "Sepolia deployment test failed"
                exit 1
            fi
        else
            print_status "Skipping Sepolia test"
        fi
        ;;
    3)
        NETWORK="mumbai"
        print_warning "Testing on Mumbai testnet requires test MATIC"
        print_status "You can get test MATIC from: https://faucet.polygon.technology/"
        read -p "Do you have test MATIC and want to proceed? (y/N): " confirm
        
        if [[ $confirm =~ ^[Yy]$ ]]; then
            print_status "Running deployment test on Mumbai..."
            if npx hardhat run scripts/quickDeploymentTest.js --network mumbai; then
                print_success "Mumbai deployment test completed successfully!"
            else
                print_error "Mumbai deployment test failed"
                exit 1
            fi
        else
            print_status "Skipping Mumbai test"
        fi
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

print_success "🎉 All deployment tests completed successfully!"
echo ""
echo "📁 Check the following files for detailed results:"
echo "   - test-results/: Test result files"
echo "   - deployments/: Deployment information"
echo ""
echo "🎯 Next steps:"
echo "   1. ✅ Smart contracts deployed and tested"
echo "   2. ✅ Navigation system integrated"
echo "   3. 🔄 Ready for backend services integration"
echo ""
echo "🚀 Run the following to proceed to Phase 2:"
echo "   npm run start:backend-services"