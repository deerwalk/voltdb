/* This file is part of VoltDB.
 * Copyright (C) 2008-2016 VoltDB Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with VoltDB.  If not, see <http://www.gnu.org/licenses/>.
 */

package org.voltdb.dtxn;

import org.voltcore.network.Connection;
import org.voltdb.ClientResponseImpl;
import org.voltdb.InvocationDispatcher.OverrideCheck;
import org.voltdb.StoredProcedureInvocation;

/**
 * Provide an interface that both Iv2 and simple dtxn can implement.
 */
public interface TransactionCreator
{
    // create a new transaction.
    public boolean createTransaction(
            long connectionId,
            StoredProcedureInvocation invocation,
            boolean isReadOnly,
            boolean isSinglePartition,
            boolean isEverySite,
            int partition,
            int messageSize,
            long nowNanos);

    // Create a transaction using the provided txnId.
    public boolean createTransaction(
            long connectionId,
            long txnId,
            long uniqueId,
            StoredProcedureInvocation invocation,
            boolean isReadOnly,
            boolean isSinglePartition,
            boolean isEverySite,
            int partition,
            int messageSize,
            long nowNanos);

    // dispatched invocation through invocation dispatcher
    public ClientResponseImpl dispatch(
            StoredProcedureInvocation invocation,
            Connection connection,
            boolean isAdmin, OverrideCheck bypass);
    /*
     * Only used in IV2. Send a marker for the position of a multi-part transaction in
     * a single part transaction stream for a partition. The sentinel is blocks
     * all following single parts until the multi-part is completed. A sentinel is necessary
     * because the first fragment can be generated by the multi-part coordinator at any time during replay.
     */
    public void sendSentinel(long uniqueId, int partitionId);

    /**
     * Only used in IV2. Send an end-of-log message to the partition initiator,
     * so that he SPI can release any blocked txns for replay appropriately.
     *
     * @param partitionId
     */
    public void sendEOLMessage(int partitionId);

    public abstract void bindAdapter(Connection adapter);
}
