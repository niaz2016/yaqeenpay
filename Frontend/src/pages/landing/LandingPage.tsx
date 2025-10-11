import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Chip,
  Paper,
  Avatar
} from '@mui/material';
import {
  Security,
  Verified,
  Speed,
  Support,
  TrendingUp,
  Shield,
  HandshakeOutlined,
  MonetizationOn,
  CheckCircle,
  Star,
  ArrowForward,
  PlayArrow
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Security />,
      title: 'Secure Escrow',
      description: 'Your funds are safely held until both parties fulfill their obligations',
    },
    {
      icon: <Verified />,
      title: 'Verified Users',
      description: 'All users go through identity verification for added security',
    },
    {
      icon: <Speed />,
      title: 'Fast Transactions',
      description: 'Quick payment processing with real-time notifications',
    },
    {
      icon: <Support />,
      title: '24/7 Support',
      description: 'Round-the-clock customer support to resolve any disputes',
    },
  ];

  const steps = [
    {
      step: '1',
      title: 'Create Order',
      description: 'Seller creates an order with item details and price',
      icon: <HandshakeOutlined />,
    },
    {
      step: '2',
      title: 'Secure Payment',
      description: 'Buyer pays through our secure escrow system',
      icon: <MonetizationOn />,
    },
    {
      step: '3',
      title: 'Item Delivery',
      description: 'Seller ships the item with tracking information',
      icon: <TrendingUp />,
    },
    {
      step: '4',
      title: 'Confirm & Release',
      description: 'Buyer confirms delivery, funds released to seller',
      icon: <CheckCircle />,
    },
  ];

  const benefits = [
    'Protection against fraud and scams',
    'Dispute resolution service',
    'Secure wallet system',
    'Real-time transaction tracking',
    'Mobile-friendly interface',
    'Multiple payment methods',
  ];

  const testimonials = [
    {
      name: 'Ahmed Khan',
      role: 'Electronics Seller',
      rating: 5,
      comment: 'YaqeenPay has transformed my online business. Buyers trust me more knowing their money is protected.',
      avatar: 'AK',
    },
    {
      name: 'Fatima Ali',
      role: 'Fashion Buyer',
      rating: 5,
      comment: 'I feel safe buying from strangers now. The escrow service gives me peace of mind.',
      avatar: 'FA',
    },
    {
      name: 'Mohammad Hassan',
      role: 'Car Parts Dealer',
      rating: 5,
      comment: 'Excellent dispute resolution. Had an issue once, and support resolved it within hours.',
      avatar: 'MH',
    },
  ];


  return (
    <Box sx={{ minHeight: '100vh', overflow: 'hidden' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
                             radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
          }}
        />
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: 4 }}>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 'bold',
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  mb: 2,
                  lineHeight: 1.2,
                }}
              >
                Safe Transactions,{' '}
                <Box component="span" sx={{ color: '#ffeb3b' }}>
                  Guaranteed
                </Box>
              </Typography>
              
              <Typography
                variant="h6"
                sx={{
                  mb: 4,
                  opacity: 0.9,
                  fontSize: { xs: '1.1rem', md: '1.25rem' },
                  lineHeight: 1.6,
                }}
              >
                Pakistan's trusted escrow service protecting buyers and sellers in every transaction. 
                Buy and sell with confidence knowing your money is secure.
              </Typography>
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: '#ffeb3b',
                    color: '#1976d2',
                    fontWeight: 'bold',
                    px: 4,
                    py: 1.5,
                    '&:hover': { bgcolor: '#ffd54f' },
                  }}
                  onClick={() => navigate('/auth/register')}
                  endIcon={<ArrowForward />}
                >
                  Get Started Free
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => window.open('https://www.youtube.com/watch?v=fZlHcazNMrc&t=42s', '_blank', 'noopener,noreferrer')}
                  sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.7)',
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                  },
                  }}
                  startIcon={<PlayArrow />}
                >
                  Watch Demo
                </Button>
              </Stack>
              
              <Stack direction="row" spacing={4} sx={{ opacity: 0.8 }}>
                <Stack alignItems="center">
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    10K+
                  </Typography>
                  <Typography variant="body2">Secure Transactions</Typography>
                </Stack>
                <Stack alignItems="center">
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    99.9%
                  </Typography>
                  <Typography variant="body2">Success Rate</Typography>
                </Stack>
                <Stack alignItems="center">
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    24/7
                  </Typography>
                  <Typography variant="body2">Support</Typography>
                </Stack>
              </Stack>
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {/* Mockup/Illustration placeholder */}
                <Paper
                  elevation={8}
                  sx={{
                    p: 4,
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.95)',
                    color: 'primary.main',
                    maxWidth: 400,
                    width: '100%',
                  }}
                >
                  <Stack alignItems="center" spacing={2}>
                    <Shield sx={{ fontSize: 60, color: '#4caf50' }} />
                    <Typography variant="h6" color="primary" textAlign="center">
                      Your Money Protected
                    </Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      Funds held securely until delivery is confirmed by both parties
                    </Typography>
                    <Chip
                      label="100% Secure"
                      color="success"
                      variant="filled"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Stack>
                </Paper>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <Stack alignItems="center" spacing={6}>
          <Stack alignItems="center" spacing={2}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 'bold',
                textAlign: 'center',
                fontSize: { xs: '2rem', md: '2.75rem' },
              }}
            >
              Why Choose YaqeenPay?
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{
                textAlign: 'center',
                maxWidth: 600,
                fontSize: { xs: '1rem', md: '1.25rem' },
              }}
            >
              We provide the most secure and reliable escrow service in Pakistan
            </Typography>
          </Stack>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
            {features.map((feature, index) => (
              <Box key={index} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 16px)', md: '1 1 calc(25% - 24px)' }, minWidth: 250 }}>
                <Card
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        bgcolor: 'primary.light',
                        color: 'primary.main',
                        mb: 3,
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Stack>
      </Container>

      {/* How It Works Section */}
      <Box sx={{ bgcolor: '#f8f9fa', py: { xs: 8, md: 10 } }}>
        <Container maxWidth="lg">
          <Stack alignItems="center" spacing={6}>
            <Stack alignItems="center" spacing={2}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 'bold',
                  textAlign: 'center',
                  fontSize: { xs: '2rem', md: '2.75rem' },
                }}
              >
                How It Works
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{
                  textAlign: 'center',
                  maxWidth: 600,
                }}
              >
                Simple 4-step process to secure transactions
              </Typography>
            </Stack>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
              {steps.map((step, index) => (
                <Box key={index} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 16px)', md: '1 1 calc(25% - 24px)' }, minWidth: 250 }}>
                  <Stack alignItems="center" spacing={3}>
                    <Box
                      sx={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        color: 'white',
                      }}
                    >
                      {step.icon}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          bgcolor: '#ffeb3b',
                          color: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '0.875rem',
                        }}
                      >
                        {step.step}
                      </Box>
                    </Box>
                    
                    <Stack alignItems="center" spacing={1}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                        {step.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        {step.description}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Benefits Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: 6 }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 'bold',
                mb: 3,
                fontSize: { xs: '2rem', md: '2.75rem' },
              }}
            >
              Why Escrow Services Matter?
            </Typography>
            
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
              Protect yourself from online fraud and scams when dealing with strangers
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {benefits.map((benefit, index) => (
                <Box key={index} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' }, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle sx={{ color: '#4caf50' }} />
                  <Typography variant="body1">{benefit}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Paper
              elevation={4}
              sx={{
                p: 4,
                borderRadius: 4,
                bgcolor: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: 'primary.main' }}>
                Traditional vs Escrow
              </Typography>
              
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" color="error" sx={{ mb: 1 }}>
                    ❌ Traditional Payment
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Send money directly → Risk of non-delivery → No protection
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="success.main" sx={{ mb: 1 }}>
                    ✅ YaqeenPay Escrow
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Money held safely → Item delivered → Funds released → 100% Protected
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Box>
        </Box>
      </Container>

      {/* Testimonials Section */}
      <Box sx={{ bgcolor: '#f8f9fa', py: { xs: 8, md: 10 } }}>
        <Container maxWidth="lg">
          <Stack alignItems="center" spacing={6}>
            <Stack alignItems="center" spacing={2}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 'bold',
                  textAlign: 'center',
                  fontSize: { xs: '2rem', md: '2.75rem' },
                }}
              >
                What Our Users Say
              </Typography>
            </Stack>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
              {testimonials.map((testimonial, index) => (
                <Box key={index} sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 22px)' }, minWidth: 300 }}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 4 }}>
                      <Stack spacing={3}>
                        <Stack direction="row" spacing={1}>
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} sx={{ color: '#ffc107', fontSize: 20 }} />
                          ))}
                        </Stack>
                        
                        <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                          "{testimonial.comment}"
                        </Typography>
                        
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {testimonial.avatar}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {testimonial.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {testimonial.role}
                            </Typography>
                          </Box>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          py: { xs: 8, md: 10 },
        }}
      >
        <Container maxWidth="md">
          <Stack alignItems="center" spacing={4} textAlign="center">
            <Typography
              variant="h3"
              sx={{
                fontWeight: 'bold',
                fontSize: { xs: '2rem', md: '2.75rem' },
              }}
            >
              Ready to Start Safe Trading?
            </Typography>
            
            <Typography
              variant="h6"
              sx={{
                opacity: 0.9,
                maxWidth: 600,
              }}
            >
              Join thousands of satisfied users who trust YaqeenPay for their online transactions
            </Typography>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="contained"
                size="large"
                sx={{
                  bgcolor: '#ffeb3b',
                  color: '#1976d2',
                  fontWeight: 'bold',
                  px: 4,
                  py: 1.5,
                  '&:hover': { bgcolor: '#ffd54f' },
                }}
                onClick={() => navigate('/auth/register')}
                endIcon={<ArrowForward />}
              >
                Create Account
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.7)',
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                  },
                }}
                onClick={() => navigate('/auth/login')}
              >
                Sign In
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;