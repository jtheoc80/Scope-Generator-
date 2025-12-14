#!/bin/bash
#
# Persistent Build Agent
# Runs builds continuously until success, with detailed error logging
#

set -e

# Configuration
MAX_ATTEMPTS=${MAX_ATTEMPTS:-50}
BUILD_CMD=${BUILD_CMD:-"npm run build"}
LINT_CMD=${LINT_CMD:-"npm run lint"}
LOG_DIR="${LOG_DIR:-./build-logs}"
WORKSPACE_ROOT="${WORKSPACE_ROOT:-$(pwd)}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Initialize
mkdir -p "$LOG_DIR"
ATTEMPT=0
BUILD_SUCCESS=false
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

log() {
    echo -e "${BLUE}[BUILD-AGENT]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Main build loop
run_build_agent() {
    log "Starting Persistent Build Agent"
    log "Max attempts: $MAX_ATTEMPTS"
    log "Build command: $BUILD_CMD"
    log "Workspace: $WORKSPACE_ROOT"
    log "Log directory: $LOG_DIR"
    echo ""
    
    cd "$WORKSPACE_ROOT"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        log "Installing dependencies..."
        npm install 2>&1 | tee "$LOG_DIR/npm_install_$TIMESTAMP.log"
    fi
    
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ] && [ "$BUILD_SUCCESS" = false ]; do
        ATTEMPT=$((ATTEMPT + 1))
        BUILD_LOG="$LOG_DIR/build_attempt_${ATTEMPT}_$TIMESTAMP.log"
        
        log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        log "Attempt $ATTEMPT of $MAX_ATTEMPTS"
        log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        # Run the build
        if $BUILD_CMD 2>&1 | tee "$BUILD_LOG"; then
            BUILD_SUCCESS=true
            log_success "BUILD SUCCEEDED on attempt $ATTEMPT!"
            
            # Run lint check
            log "Running lint check..."
            LINT_LOG="$LOG_DIR/lint_$TIMESTAMP.log"
            if $LINT_CMD 2>&1 | tee "$LINT_LOG"; then
                log_success "Lint check passed!"
            else
                log_warning "Lint check has warnings/errors (see $LINT_LOG)"
            fi
            
            # Final summary
            echo ""
            log_success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            log_success "BUILD COMPLETED SUCCESSFULLY"
            log_success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            log_success "Total attempts: $ATTEMPT"
            log_success "Build log: $BUILD_LOG"
            log_success "Timestamp: $(date)"
            echo ""
            
            # Create success marker
            echo "{
  \"status\": \"success\",
  \"attempts\": $ATTEMPT,
  \"timestamp\": \"$(date -Iseconds)\",
  \"build_log\": \"$BUILD_LOG\"
}" > "$LOG_DIR/build_status.json"
            
            return 0
        else
            log_error "Build failed on attempt $ATTEMPT"
            log "Error log saved to: $BUILD_LOG"
            
            # Extract and display key errors
            log "Key errors detected:"
            grep -E "(error TS|Error:|failed|Module not found)" "$BUILD_LOG" | head -20 || true
            
            echo ""
            log_warning "Waiting 2 seconds before retry..."
            sleep 2
        fi
    done
    
    if [ "$BUILD_SUCCESS" = false ]; then
        log_error "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        log_error "BUILD FAILED after $MAX_ATTEMPTS attempts"
        log_error "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        log_error "Review logs in: $LOG_DIR"
        
        # Create failure marker
        echo "{
  \"status\": \"failed\",
  \"attempts\": $ATTEMPT,
  \"timestamp\": \"$(date -Iseconds)\",
  \"build_log\": \"$BUILD_LOG\"
}" > "$LOG_DIR/build_status.json"
        
        return 1
    fi
}

# Show help
show_help() {
    echo "Persistent Build Agent"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -m, --max N    Set maximum attempts (default: 50)"
    echo "  -c, --cmd CMD  Set build command (default: 'npm run build')"
    echo ""
    echo "Environment variables:"
    echo "  MAX_ATTEMPTS   Maximum build attempts"
    echo "  BUILD_CMD      Build command to run"
    echo "  LINT_CMD       Lint command to run"
    echo "  LOG_DIR        Directory for build logs"
    echo "  WORKSPACE_ROOT Workspace root directory"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -m|--max)
            MAX_ATTEMPTS="$2"
            shift 2
            ;;
        -c|--cmd)
            BUILD_CMD="$2"
            shift 2
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run the agent
run_build_agent
