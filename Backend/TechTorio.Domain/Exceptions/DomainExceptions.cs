using System;

namespace TechTorio.Domain.Exceptions
{
    public abstract class DomainException : Exception
    {
        protected DomainException(string message) : base(message)
        {
        }
    }
    
    public class InvalidOperationDomainException : DomainException
    {
        public InvalidOperationDomainException(string message) : base(message)
        {
        }
    }
    
    public class EntityNotFoundException : DomainException
    {
        public EntityNotFoundException(string entityName, Guid id) 
            : base($"{entityName} with ID {id} was not found.")
        {
        }
    }
    
    public class InsufficientFundsException : DomainException
    {
        public InsufficientFundsException(Guid accountId, decimal requested, decimal available) 
            : base($"Account {accountId} has insufficient funds. Requested: {requested}, Available: {available}")
        {
        }
    }
    
    public class InvalidEscrowOperationException : DomainException
    {
        public InvalidEscrowOperationException(Guid escrowId, string operation, string currentStatus) 
            : base($"Cannot perform operation '{operation}' on escrow {escrowId} with status '{currentStatus}'")
        {
        }
    }
}